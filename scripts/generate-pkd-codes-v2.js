const fs = require('fs');
const path = require('path');

// Manual extraction of PKD codes from the content chunks we observed
// This is based on the actual content structure from pkd.com.pl
const pkdCodesData = [
  // Section A - Agriculture, forestry and fishing
  { code: '01.11.Z', name: 'Uprawa zbóż, roślin strączkowych i roślin oleistych na nasiona, z wyłączeniem ryżu' },
  { code: '01.12.Z', name: 'Uprawa ryżu' },
  { code: '01.13.Z', name: 'Uprawa warzyw, włączając melony oraz uprawa roślin korzeniowych i roślin bulwiastych' },
  { code: '01.14.Z', name: 'Uprawa trzciny cukrowej' },
  { code: '01.15.Z', name: 'Uprawa tytoniu' },
  { code: '01.16.Z', name: 'Uprawa roślin włóknistych' },
  { code: '01.19.Z', name: 'Pozostałe uprawy rolne inne niż wieloletnie' },
  { code: '01.21.Z', name: 'Uprawa winogron' },
  { code: '01.22.Z', name: 'Uprawa drzew i krzewów owocowych tropikalnych i podzwrotnikowych' },
  { code: '01.23.Z', name: 'Uprawa drzew i krzewów owocowych cytrusowych' },
  { code: '01.24.Z', name: 'Uprawa drzew i krzewów owocowych ziarnkowych i pestkowych' },
  { code: '01.25.Z', name: 'Uprawa pozostałych drzew i krzewów owocowych oraz orzechów' },
  { code: '01.26.Z', name: 'Uprawa drzew oleistych' },
  { code: '01.27.Z', name: 'Uprawa roślin wykorzystywanych do produkcji napojów' },
  { code: '01.28.Z', name: 'Uprawa roślin przyprawowych i aromatycznych oraz roślin wykorzystywanych do produkcji leków i wyrobów farmaceutycznych' },
  { code: '01.29.Z', name: 'Uprawa pozostałych roślin wieloletnich' },
  { code: '01.30.Z', name: 'Rozmnażanie roślin' },
  { code: '01.41.Z', name: 'Chów i hodowla bydła mlecznego' },
  { code: '01.42.Z', name: 'Chów i hodowla pozostałego bydła i bawołów' },
  { code: '01.43.Z', name: 'Chów i hodowla koni i pozostałych zwierząt koniowatych' },
  { code: '01.44.Z', name: 'Chów i hodowla wielbłądów i zwierząt wielbłądowatych' },
  { code: '01.45.Z', name: 'Chów i hodowla owiec i kóz' },
  { code: '01.46.Z', name: 'Chów i hodowla świń' },
  { code: '01.47.Z', name: 'Chów i hodowla drobiu' },
  { code: '01.49.Z', name: 'Chów i hodowla pozostałych zwierząt' },
  { code: '01.50.Z', name: 'Uprawy rolne połączone z chowem i hodowlą zwierząt (działalność mieszana)' },
  { code: '01.61.Z', name: 'Działalność usługowa wspomagająca produkcję roślinną' },
  { code: '01.62.Z', name: 'Działalność usługowa wspomagająca chów i hodowlę zwierząt' },
  { code: '01.63.Z', name: 'Działalność związana z przetwarzaniem produktów po zbiorach' },
  { code: '01.64.Z', name: 'Przetwarzanie nasion w celu siewu' },
  { code: '01.70.Z', name: 'Łowiectwo, pozyskiwanie zwierząt futerkowych oraz działalność usługowa związana z łowiectwem' },
  
  // Section B - Mining and quarrying
  { code: '02.10.Z', name: 'Leśnictwo i pozostała gospodarka leśna' },
  { code: '02.20.Z', name: 'Pozyskiwanie drewna' },
  { code: '02.30.Z', name: 'Zbieranie dziko rosnących produktów nieleśnych' },
  { code: '02.40.Z', name: 'Działalność usługowa wspomagająca gospodarkę leśną' },
  
  { code: '03.11.Z', name: 'Rybołówstwo morskie' },
  { code: '03.12.Z', name: 'Rybołówstwo słodkowodne' },
  { code: '03.21.Z', name: 'Akwakultura morska' },
  { code: '03.22.Z', name: 'Akwakultura słodkowodna' },
  
  { code: '05.10.Z', name: 'Wydobywanie węgla kamiennego' },
  { code: '05.20.Z', name: 'Wydobywanie węgla brunatnego' },
  
  { code: '06.10.Z', name: 'Wydobywanie ropy naftowej' },
  { code: '06.20.Z', name: 'Wydobywanie gazu ziemnego' },
  
  { code: '07.10.Z', name: 'Wydobywanie rud żelaza' },
  { code: '07.21.Z', name: 'Wydobywanie rud uranu i toru' },
  { code: '07.29.Z', name: 'Wydobywanie pozostałych rud metali nieżelaznych' },
  
  { code: '08.11.Z', name: 'Wydobywanie kamienia ozdobnego i budowlanego, wapienia, gipsu, kredy i łupków' },
  { code: '08.12.Z', name: 'Wydobywanie żwiru, piasku, gliny i kaolinu' },
  { code: '08.91.Z', name: 'Wydobywanie minerałów dla przemysłu chemicznego i nawozów naturalnych' },
  { code: '08.92.Z', name: 'Wydobywanie i przeróbka torfu' },
  { code: '08.93.Z', name: 'Wydobywanie soli' },
  { code: '08.99.Z', name: 'Wydobywanie pozostałych kopalin, gdzie indziej niesklasyfikowane' },
  
  { code: '09.10.Z', name: 'Działalność usługowa wspomagająca wydobywanie ropy naftowej i gazu ziemnego' },
  { code: '09.90.Z', name: 'Działalność usługowa wspomagająca pozostałe górnictwo i wydobywanie' },
  
  // Section C - Manufacturing
  { code: '10.11.Z', name: 'Przetwarzanie i konserwowanie mięsa, z wyłączeniem mięsa z drobiu' },
  { code: '10.12.Z', name: 'Przetwarzanie i konserwowanie mięsa z drobiu' },
  { code: '10.13.Z', name: 'Produkcja wyrobów z mięsa, włączając wyroby z mięsa drobiowego' },
  { code: '10.20.Z', name: 'Przetwarzanie i konserwowanie ryb, skorupiaków i mięczaków' },
  { code: '10.31.Z', name: 'Przetwarzanie i konserwowanie ziemniaków' },
  { code: '10.32.Z', name: 'Produkcja soków z owoców i warzyw' },
  { code: '10.39.Z', name: 'Pozostałe przetwarzanie i konserwowanie owoców i warzyw' },
  { code: '10.41.Z', name: 'Produkcja olejów i tłuszczów' },
  { code: '10.42.Z', name: 'Produkcja margaryny i podobnych tłuszczów jadalnych' },
  { code: '10.51.Z', name: 'Przetwórstwo mleka i produkcja serów' },
  { code: '10.52.Z', name: 'Produkcja lodów' },
  { code: '10.61.Z', name: 'Produkcja wyrobów młynarskich' },
  { code: '10.62.Z', name: 'Produkcja skrobi i wyrobów skrobiowych' },
  { code: '10.71.Z', name: 'Produkcja pieczywa; produkcja świeżych wyrobów cukierniczych' },
  { code: '10.72.Z', name: 'Produkcja sucharów i herbatników; produkcja trwałych wyrobów cukierniczych' },
  { code: '10.73.Z', name: 'Produkcja makaronów, kuskusu i podobnych mącznych produktów spożywczych' },
  { code: '10.81.Z', name: 'Produkcja cukru' },
  { code: '10.82.Z', name: 'Produkcja wyrobów kakaowych i czekolady oraz wyrobów cukierniczych' },
  { code: '10.83.Z', name: 'Przetwarzanie herbaty i kawy' },
  { code: '10.84.Z', name: 'Produkcja przypraw i produktów aromatyzujących' },
  { code: '10.85.Z', name: 'Produkcja gotowych posiłków i potraw' },
  { code: '10.86.Z', name: 'Produkcja homogenizowanych preparatów spożywczych i żywności dietetycznej' },
  { code: '10.89.Z', name: 'Produkcja pozostałych artykułów spożywczych, gdzie indziej niesklasyfikowana' },
  { code: '10.91.Z', name: 'Produkcja gotowych pasz dla zwierząt gospodarskich' },
  { code: '10.92.Z', name: 'Produkcja gotowych pasz dla pozostałych zwierząt' },
  
  { code: '11.01.Z', name: 'Destylacja, rektyfikacja i mieszanie alkoholi' },
  { code: '11.02.Z', name: 'Produkcja wina z winogron' },
  { code: '11.03.Z', name: 'Produkcja cydrów i innych win owocowych' },
  { code: '11.04.Z', name: 'Produkcja pozostałych napojów alkoholowych destylowanych' },
  { code: '11.05.Z', name: 'Produkcja piwa' },
  { code: '11.06.Z', name: 'Produkcja słodu' },
  { code: '11.07.Z', name: 'Produkcja napojów bezalkoholowych; produkcja wód mineralnych i pozostałych wód butelkowanych' },
  
  { code: '12.00.Z', name: 'Produkcja wyrobów tytoniowych' },
  
  // Textile and clothing
  { code: '13.10.Z', name: 'Przygotowanie i przędzenie włókien tekstylnych' },
  { code: '13.20.Z', name: 'Tkactwo' },
  { code: '13.30.Z', name: 'Wykańczanie wyrobów tekstylnych' },
  { code: '13.91.Z', name: 'Produkcja dzianin' },
  { code: '13.92.Z', name: 'Produkcja wyrobów tekstylnych gotowych, z wyłączeniem odzieży' },
  { code: '13.93.Z', name: 'Produkcja dywanów i wykładzin dywanowych' },
  { code: '13.94.Z', name: 'Produkcja lin, sznurów, powrozów i sieci' },
  { code: '13.95.Z', name: 'Produkcja włóknin i wyrobów z włóknin, z wyłączeniem odzieży' },
  { code: '13.96.Z', name: 'Produkcja pozostałych wyrobów tekstylnych technicznych i przemysłowych' },
  { code: '13.99.Z', name: 'Produkcja pozostałych wyrobów tekstylnych, gdzie indziej niesklasyfikowana' },
  
  { code: '14.11.Z', name: 'Produkcja odzieży skórzanej' },
  { code: '14.12.Z', name: 'Produkcja odzieży roboczej' },
  { code: '14.13.Z', name: 'Produkcja pozostałej odzieży wierzchniej' },
  { code: '14.14.Z', name: 'Produkcja bielizny' },
  { code: '14.19.Z', name: 'Produkcja pozostałej odzieży i dodatków do odzieży' },
  { code: '14.20.Z', name: 'Produkcja wyrobów futrzarskich' },
  { code: '14.31.Z', name: 'Produkcja wyrobów pończoszniczych' },
  { code: '14.39.Z', name: 'Produkcja pozostałej odzieży dzianej' },
  
  { code: '15.11.Z', name: 'Wyprawa skór, garbowanie; wyprawa i barwienie skór futerkowych' },
  { code: '15.12.Z', name: 'Produkcja toreb bagażowych, toreb ręcznych i podobnych wyrobów kaletniczych; produkcja wyrobów rymarskich' },
  { code: '15.20.Z', name: 'Produkcja obuwia' },
  
  // Wood and paper
  { code: '16.10.Z', name: 'Produkcja wyrobów tartacznych' },
  { code: '16.21.Z', name: 'Produkcja arkuszy fornirowych i płyt wykonanych na bazie drewna' },
  { code: '16.22.Z', name: 'Produkcja gotowych parkietów podłogowych' },
  { code: '16.23.Z', name: 'Produkcja pozostałych wyrobów stolarskich i ciesielskich dla budownictwa' },
  { code: '16.24.Z', name: 'Produkcja opakowań drewnianych' },
  { code: '16.29.Z', name: 'Produkcja pozostałych wyrobów z drewna; produkcja wyrobów z korka, słomy i materiałów używanych do wyplatania' },
  
  { code: '17.11.Z', name: 'Produkcja masy włóknistej' },
  { code: '17.12.Z', name: 'Produkcja papieru i tektury' },
  { code: '17.21.Z', name: 'Produkcja papieru falistego i tektury falistej oraz opakowań z papieru i tektury' },
  { code: '17.22.Z', name: 'Produkcja artykułów gospodarstwa domowego, toaletowych i sanitarnych' },
  { code: '17.23.Z', name: 'Produkcja artykułów piśmiennych' },
  { code: '17.24.Z', name: 'Produkcja tapet' },
  { code: '17.29.Z', name: 'Produkcja pozostałych wyrobów z papieru i tektury' },
  
  { code: '18.11.Z', name: 'Drukowanie gazet' },
  { code: '18.12.Z', name: 'Pozostała działalność drukarska' },
  { code: '18.13.Z', name: 'Przygotowanie do druku i publikowania' },
  { code: '18.14.Z', name: 'Introligatorstwo i podobne usługi' },
  { code: '18.20.Z', name: 'Reprodukcja zapisanych nośników informacji' }
];

// This is a comprehensive but not complete list. For a production system,
// you would want to implement proper web scraping or use an official API.
// Adding more sections systematically...

const additionalCodes = [
  // Continuing with more manufacturing codes...
  { code: '19.10.Z', name: 'Produkcja produktów koksowniczych' },
  { code: '19.20.Z', name: 'Produkcja produktów rafinacji ropy naftowej' },
  
  // Chemical industry
  { code: '20.11.Z', name: 'Produkcja gazów przemysłowych' },
  { code: '20.12.Z', name: 'Produkcja barwników i pigmentów' },
  { code: '20.13.Z', name: 'Produkcja pozostałych podstawowych chemikaliów nieorganicznych' },
  { code: '20.14.Z', name: 'Produkcja pozostałych podstawowych chemikaliów organicznych' },
  { code: '20.15.Z', name: 'Produkcja nawozów i związków azotowych' },
  { code: '20.16.Z', name: 'Produkcja tworzyw sztucznych w formach podstawowych' },
  { code: '20.17.Z', name: 'Produkcja kauczuku syntetycznego w formach podstawowych' },
  { code: '20.20.Z', name: 'Produkcja pestycydów i pozostałych środków agrochemicznych' },
  { code: '20.30.Z', name: 'Produkcja farb, lakierów, podobnych powłok, farb drukarskich i kitu' },
  { code: '20.41.Z', name: 'Produkcja mydeł i detergentów, środków czyszczących i polerskich' },
  { code: '20.42.Z', name: 'Produkcja perfum i kosmetyków' },
  { code: '20.51.Z', name: 'Produkcja wyrobów pirotechnicznych' },
  { code: '20.52.Z', name: 'Produkcja klejów' },
  { code: '20.53.Z', name: 'Produkcja olejków eterycznych' },
  { code: '20.59.Z', name: 'Produkcja pozostałych wyrobów chemicznych, gdzie indziej niesklasyfikowana' },
  { code: '20.60.Z', name: 'Produkcja włókien sztucznych' },
  
  // Pharmaceuticals
  { code: '21.10.Z', name: 'Produkcja podstawowych substancji farmaceutycznych' },
  { code: '21.20.Z', name: 'Produkcja leków i pozostałych wyrobów farmaceutycznych' },
  
  // Rubber and plastics
  { code: '22.11.Z', name: 'Produkcja opon i dętek; bieżnikowanie i regeneracja opon' },
  { code: '22.19.Z', name: 'Produkcja pozostałych wyrobów z gumy' },
  { code: '22.21.Z', name: 'Produkcja płyt, arkuszy, rur i kształtowników z tworzyw sztucznych' },
  { code: '22.22.Z', name: 'Produkcja opakowań z tworzyw sztucznych' },
  { code: '22.23.Z', name: 'Produkcja wyrobów budowlanych z tworzyw sztucznych' },
  { code: '22.29.Z', name: 'Produkcja pozostałych wyrobów z tworzyw sztucznych' }
];

// Combine all codes
const allPKDCodes = [...pkdCodesData, ...additionalCodes];

// Generate TypeScript file content
function generateTypeScriptFile(pkdCodes) {
  const header = `// PKD codes list - manually curated from official sources
// Source: https://www.pkd.com.pl/wyszukiwarka/lista_pkd
// Generated on: ${new Date().toISOString()}
// Note: This is a representative subset. For complete list, implement proper web scraping.

export interface PKDCode {
  code: string;
  name: string;
}

export const PKD_CODES: PKDCode[] = [`;

  const codeEntries = pkdCodes.map(({ code, name }) => 
    `  { code: '${code}', name: '${name.replace(/'/g, "\\'")}' }`
  ).join(',\n');

  const footer = `\n];

export default PKD_CODES;
`;

  return header + '\n' + codeEntries + footer;
}

// Main function
function main() {
  try {
    console.log(`Generating PKD codes file with ${allPKDCodes.length} codes...`);
    
    // Sort codes
    const sortedCodes = allPKDCodes.sort((a, b) => a.code.localeCompare(b.code));
    
    // Generate TypeScript content
    const tsContent = generateTypeScriptFile(sortedCodes);
    
    // Write to file
    const outputPath = path.join(__dirname, '../src/config/pkdCodes.ts');
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    
    console.log(`PKD codes written to ${outputPath}`);
    console.log('Sample codes:');
    sortedCodes.slice(0, 10).forEach(({ code, name }) => {
      console.log(`  ${code}: ${name}`);
    });
    
  } catch (error) {
    console.error('Error generating PKD codes:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { allPKDCodes };
