const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const promptTemplate = process.env.PERPLEXITY_PROMPT_TEMPLATE;

const supabase = createClient(supabaseUrl, supabaseKey);

// Sanitize input - remove everything except letters, digits, spaces, and basic punctuation
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9\s\-\.]/g, '').trim();
}

// Check if postal code is valid Polish format
function isValidPostalCode(postalCode) {
  return /^[0-9]{2}-[0-9]{3}$/.test(postalCode);
}

// Generate control sum from user data
function generateControlSum(formData) {
  const dataString = `${formData.rodzajDzialalnosci}|${formData.pkdCode}|${formData.postalCode}|${formData.politicalConnections}`;
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Get client IP address
function getClientIP(event) {
  return event.headers['x-forwarded-for'] || 
         event.headers['x-real-ip'] || 
         event.connection?.remoteAddress || 
         'unknown';
}

// Check for cached response in last 3 days
async function getCachedResponse(controlSum) {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const { data, error } = await supabase
    .from('form_submissions')
    .select('response')
    .eq('control_sum', controlSum)
    .gte('created_at', threeDaysAgo.toISOString())
    .not('response', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error checking cached response:', error);
    return null;
  }
  
  return data.length > 0 ? data[0].response : null;
}

// Check daily request limit (global - 12 requests total per day)
async function checkDailyLimit() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('form_submissions')
    .select('id')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);
  
  if (error) {
    console.error('Error checking daily limit:', error);
    throw new Error('Błąd sprawdzania limitu żądań');
  }
  
  return data.length >= 12;
}

// Save form submission to database
async function saveSubmission(formData, userIP, controlSum, response = null) {
  const { error } = await supabase
    .from('form_submissions')
    .insert([{
      rodzaj_dzialalnosci: formData.rodzajDzialalnosci,
      pkd_code: formData.pkdCode,
      postal_code: formData.postalCode,
      political_connections: formData.politicalConnections,
      user_ip: userIP,
      control_sum: controlSum,
      response: response,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error('Error saving submission:', error);
    throw new Error('Błąd zapisywania danych');
  }
}

// Generate project name using Perplexity AI
async function generateProjectName(rodzajDzialalnosci) {
  if (!promptTemplate) {
    throw new Error('PERPLEXITY_PROMPT_TEMPLATE environment variable is not configured');
  }
  
  const prompt = promptTemplate
    .replace(/\\n/g, '\n') // Convert \n strings to actual line breaks
    .replace(/{rodzajDzialalnosci}/g, rodzajDzialalnosci); // Replace all occurrences

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status} - ${errorText}`);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from Perplexity API:', data);
      throw new Error('Invalid response from Perplexity API');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw new Error(`Błąd generowania nazwy projektu: ${error.message}`);
  }
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const formData = JSON.parse(event.body);
    
    // Get client IP
    const userIP = getClientIP(event);
    
    // Sanitize inputs
    const sanitizedData = {
      rodzajDzialalnosci: sanitizeInput(formData.rodzajDzialalnosci),
      pkdCode: sanitizeInput(formData.pkdCode),
      postalCode: sanitizeInput(formData.postalCode),
      politicalConnections: Boolean(formData.politicalConnections)
    };
    
    // Validate required fields
    if (!sanitizedData.rodzajDzialalnosci || !sanitizedData.pkdCode || !sanitizedData.postalCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Wszystkie pola są wymagane' })
      };
    }
    
    // Validate postal code format
    if (!isValidPostalCode(sanitizedData.postalCode)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nieprawidłowy format kodu pocztowego' })
      };
    }
    
    // Generate control sum from user data
    const controlSum = generateControlSum(sanitizedData);
    
    // Check for cached response in last 3 days
    const cachedResponse = await getCachedResponse(controlSum);
    if (cachedResponse) {
      console.log('Returning cached response for control sum:', controlSum);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          projectName: cachedResponse,
          cached: true
        })
      };
    }
    
    // Check daily limit (global - 12 requests total per day)
    const limitExceeded = await checkDailyLimit();
    if (limitExceeded) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          limitExceeded: true,
          message: 'Przekroczono limit 10 żądań dziennie. Limit znika jak limity w KPO. Spróbuj ponownie jutro.\nA dzisiaj posłuchaj audiobajki z dzieckiem:\n https://www.zwierzetadetektywi.pl/audiobajki/'
        })
      };
    }
    
    // Generate project name using Perplexity AI
    const projectName = await generateProjectName(sanitizedData.rodzajDzialalnosci);
    
    // Save submission to database with response
    await saveSubmission(sanitizedData, userIP, controlSum, projectName);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        projectName: projectName,
        cached: false
      })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || 'Wystąpił błąd serwera'
      })
    };
  }
};
