const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

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

// Get client IP address
function getClientIP(event) {
  return event.headers['x-forwarded-for'] || 
         event.headers['x-real-ip'] || 
         event.connection?.remoteAddress || 
         'unknown';
}

// Check daily request limit
async function checkDailyLimit(userIP) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('form_submissions')
    .select('id')
    .eq('user_ip', userIP)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);
  
  if (error) {
    console.error('Error checking daily limit:', error);
    throw new Error('Błąd sprawdzania limitu żądań');
  }
  
  return data.length >= 10;
}

// Save form submission to database
async function saveSubmission(formData, userIP) {
  const { error } = await supabase
    .from('form_submissions')
    .insert([{
      rodzaj_dzialalnosci: formData.rodzajDzialalnosci,
      pkd_code: formData.pkdCode,
      postal_code: formData.postalCode,
      political_connections: formData.politicalConnections,
      user_ip: userIP,
      created_at: new Date().toISOString()
    }]);
  
  if (error) {
    console.error('Error saving submission:', error);
    throw new Error('Błąd zapisywania danych');
  }
}

// Generate project name using Perplexity AI
async function generateProjectName(rodzajDzialalnosci) {
  const prompt = `Proszę wygeneruj profesjonalną i poważnie brzmiącą nazwę projektu modernizacji mojej działalności ${rodzajDzialalnosci}, która będzie skierowana na pozyskanie środków z Krajowego Planu Odbudowy (KPO). Nazwa powinna uwzględniać:

podniesienie odporności firmy na ryzyka i kryzysy,

wdrożenie ekologicznych i energooszczędnych rozwiązań,

innowacje i cyfrową transformację,

zgodność z kluczowymi priorytetami KPO,

poprawę efektywności i jakości usług lub produktów,

Nazwa projektu ma zaczynać się od frazy „Transformacja działalności poprzez rozwój i zakup..." i mieć formę rozbudowanego, wielolinijkowego sformułowania (minimum 6 linijek). Proszę o profesjonalny i korporacyjny styl.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
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
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw new Error('Błąd generowania nazwy projektu');
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
    
    // Check daily limit
    const limitExceeded = await checkDailyLimit(userIP);
    if (limitExceeded) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          limitExceeded: true,
          message: 'Przekroczono limit 10 żądań dziennie'
        })
      };
    }
    
    // Save submission to database
    await saveSubmission(sanitizedData, userIP);
    
    // Generate project name using Perplexity AI
    const projectName = await generateProjectName(sanitizedData.rodzajDzialalnosci);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        projectName: projectName
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
