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
podniesienie odporności firmy na ryzyka i kryzysy, wdrożenie ekologicznych i energooszczędnych rozwiązań,
innowacje i cyfrową transformację, zgodność z kluczowymi priorytetami KPO, poprawę efektywności i jakości usług lub produktów,
Nazwa projektu ma zaczynać się od frazy „Transformacja działalności poprzez rozwój i zakup..." i mieć formę rozbudowanego, wielolinijkowego sformułowania (minimum 6 linijek). Proszę o profesjonalny i korporacyjny styl.
Nie dodawaj cytatów, ani innych tekstów poza nazwą projektu. W nazwie uwzględnij rodzaj działalności i kod PKD.
Na koniec dodaj coś zabawnego o koneksjach politycznych, jachtach, ekspresach do kawy w kontekście dotacji z budetu Państwa w odniesieni do {rodzajDzialalnosci}.`;

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
    
    // Check daily limit (global - 10 requests total per day)
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
