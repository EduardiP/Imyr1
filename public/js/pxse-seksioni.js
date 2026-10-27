/*
 * pxse-seksioni.js (PhronexusAI): seksioni publik "Sinjalet + Dergimi i email-eve", nga prototipi i projektit emailet.
 * Ndryshimet nga prototipi: pa te dhena shembull; studimi thirret te /api/pxse (ndermjetesi i PhronexusAI);
 * cdo prove ka nje kod seance (localStorage 'pxse_seanca'); butonat e hyrjes e dergojne domainin ne ngjarjen px-veprim.
 * Pjeset qe s'jane ndertuar ende (kerkimi i sinjaleve, direktoria, dergimi) shfaqin "Coming soon".
 *
 * Izolimi (qe te mos prishe asgje kur kalohet te projekti real):
 *  - Eshte nje "Web Component" me Shadow DOM: <px-sinjale-email>. CSS-ja e tij nuk prek faqen, dhe CSS-ja e faqes nuk e prek ate.
 *  - I gjithe JavaScript-i eshte brenda nje funksioni te mbyllur (IIFE). I vetmi emer global eshte elementi "px-sinjale-email".
 *  - Nuk perdor databaze, variabla mjedisi apo rruge API. Te dhenat jane shembuj (prototip).
 *
 * Ngjyrat: te gjitha jane variabla CSS (--px-...) me vlera paresore me poshte, te seksioni ":host".
 * Per t'i bere si phronexusai.com, mjafton te ndryshohen ketu, ose nga faqja:  px-sinjale-email { --px-theks: #xxxxxx; }
 *
 * Perdorimi:  <script src="/prototip-px.js"></script>  <px-sinjale-email lang="en"></px-sinjale-email>   (lang: "en" ose "sq")
 *
 * Majtas: Dergimi i email-eve. Djathtas: Sinjalet. Siper: header i perbashket ("100% free").
 * Ndarja horizontale: dy pjese te barabarta, ne mes  ‹ | ›  (vija ndarese me nje shigjete ne secilen ane).
 *  - "›" zgjeron pjesen e majte ne gjithe gjeresine (mbetet "‹" ne skajin e djathte).
 *  - "‹" zgjeron pjesen e djathte ne gjithe gjeresine (mbetet "›" ne skajin e majte).
 *  - Pas zgjerimit te pare nuk kthehet me ne ndarjen 50/50: shigjeta kalon nga njera pjese e plote te tjetra.
 *  - Permbajtja pershtatet me gjeresine (container queries): kur pjesa zgjerohet, shfaqen opsione shtese.
 */
(function () {
  'use strict';
  if (window.customElements.get('px-sinjale-email')) return;

  var TEKSTET = {
    en: {
      shembull: 'Example data',
      shigjetaMajtas: 'Show signals in full width',
      shigjetaDjathtas: 'Show sending in full width',
      kokaTeksti: '100% free',
      sEyebrow: 'Free · no sign-up',
      sPerKe: 'For B2B and B2C businesses',
      sNjeKerkim: 'Free: one search per domain, posts from the last 5 months.',
      sHyr: 'Sign in to get the latest interest signals for your business',
      sTitulli: 'Who is looking for what you sell',
      sNen: 'We scan public conversations on Reddit, Hacker News, Indie Hackers and more, and AI shows you the people who need your product right now.',
      sDomain: 'yourcompany.com',
      sGjej: 'Try it free: find interest signals with AI',
      sDukeKerkuar: 'Scanning conversations…',
      sRezultatetPer: 'Results for',
      sShembullTitulli: 'Example results',
      sLloji: 'determined by AI',
      sStatJava: 'signals this week',
      sStatTeMira: 'with score 80+',
      sStatBurime: 'sources',
      sFiltri: 'Filters',
      sBurimi: 'Source',
      sTeGjitha: 'All sources',
      sPikeMin: 'Min. score',
      sCdoPike: 'All (40+)',
      sPeriudha: 'Period',
      sJava: 'Last 7 days',
      sMuaji: 'Last 30 days',
      sPese: 'Last 5 months',
      sShfaqen: 'Showing {n} signals',
      sShfaqen1: 'Showing 1 signal',
      sStatusi: 'Status',
      stAll: 'All', stNew: 'New', stSaved: 'Saved', stReplied: 'Replied', stRejected: 'Rejected',
      bSave: 'Save', bReplied: 'Replied', bReject: 'Reject',
      bAI: 'AI reply', bAIMbetur: '{n} free',
      aiTitulli: 'AI reply draft', aiKopjo: 'Copy', aiKopjuar: 'Copied', aiShenim: 'Review it, change what you want, then post it yourself.',
      aiDuke: 'AI is writing a reply…',
      aiLimitTitulli: 'AI replies stay free. To use them without limits:',
      aiLimitPerfundo: 'Sign in, complete your profile (AI fills it in for you) and add the PhronexusAI snippet to your website.',
      sPiketTitulli: 'What the score means:',
      sPiketNen: 'AI rates each post from 0 to 100 for how likely the author needs your product now.',
      sPiket80: 'they ask for a tool like yours, often while describing the problem.',
      sPiket60: 'they describe the exact problem your product solves.',
      sPiket40: 'your product could help, but they do not ask for it.',
      sPiketFsheh: 'Posts under 40 are hidden.',
      sStatGjetur: 'posts checked by AI',
      sKonfirmoB2B: 'We think your customers are businesses (B2B). Correct?',
      sKonfirmoB2C: 'We think your customers are individual consumers (B2C). Correct?',
      sPo: 'Yes',
      sJoIndivide: 'No, they are individuals',
      sJoBiznese: 'No, they are businesses',
      sPerdorur: 'The free search for this domain has already been used.',
      sAsnjeFort: 'No strong signals in the last 5 months.',
      sDukeFilluar: 'Starting…',
      sKohaPritjes: 'This takes about a minute. You can keep this page open.',
      sHape: 'Open post',
      sArsye: 'Why it fits',
      sTermat: 'Matched terms',
      sMbyllur: 'Sign up free to see all {n} signals and get new ones every day',
      sRegjistrohu: 'Sign up free',
      sAsnje: 'No signals match these filters.',
      eEyebrow: 'Email outreach',
      eTitulli: 'Send from your own address, on schedule',
      eNen: 'Pick businesses from our directory, write once, and let it send at the right time. Emails go out from your own mailbox.',
      eHapi1: 'Connect your email',
      eHapi1Nen: 'Emails are sent from your address, never from ours.',
      eTjeter: 'Other (SMTP)',
      eLidhur: 'Connected:',
      eHapi2: 'Choose recipients',
      eKategoria: 'Category',
      eVendi: 'Country',
      eTipi: 'Business type',
      eVetemVerifikuar: 'Only businesses with a verified email',
      eGjetur: 'businesses match',
      eHapi3: 'Write your message',
      eSubjekti: 'Subject',
      eSubjektiVlera: 'Quick idea for {company}',
      eTrupi: 'Message',
      eTrupiVlera: 'Hi {company} team,\n\nAI writes your message here after it studies your business.',
      eFusha: 'Insert field:',
      eHapi4: 'Schedule',
      eData: 'Start date',
      eOra: 'Time',
      eLimiti: 'Max. per day',
      eZonaKohore: "Send in each recipient's time zone",
      ePlanifiko: 'Schedule sending',
      eToast: 'Coming soon.',
      eLigjore: 'One-click unsubscribe and a shared do-not-contact list are included in every email.',
      eStatistikat: 'This campaign',
      eDerguar: 'Sent',
      ePergjigje: 'Replies',
      eCregjistruar: 'Unsubscribed',
      eFalas: 'Included in the free plan',
      eTitulli2: 'Send emails to businesses that could become your customers',
      eNen2: 'Write one message, pick businesses from our directory, and schedule when each email goes out.',
      eVetemB2B: 'Only for B2B',
      eVetemB2BNen: 'for businesses that sell to other businesses',
      eProvoAI: 'Try it: generate your email with AI',
      eStudio: 'Write my email with AI',
      eDomaini: 'yourcompany.com',
      eDukeStudiuar: 'AI is reading {d} and writing your email…',
      eStudiuar: 'Done. AI wrote the subject and message and picked the best categories for {d}. You can still edit everything.',
      eMesazhi: 'Your email',
      eMarresit: 'Recipients',
      eTeRejat: 'Newest businesses first',
      eRekomanduar: 'Recommended for {d}',
      eTeGjithaKat: 'All categories',
      eZgjedhur: '{n} of 3 selected',
      eShtuar: 'added {n}d ago',
      eOraretTitulli: 'Schedule',
      eOraretBosh: 'Select up to 3 businesses above to schedule their emails.',
      eRregulli: 'Free try: up to 3 emails, at least 4 hours apart.',
      eDergoNga: 'Send from your mailbox',
      eDergoNgaNen: 'Sign in to Gmail or Outlook so the emails go out from your own address, and replies come back to you. "Other (SMTP)" is for any other email provider, using its server settings.',
      eDergo: 'Send',
      eLimit3: 'The free try sends up to 3 emails per domain. Sign in to send to more businesses with professional sending.',
      eKufiri4: 'In the free try, emails must be at least 4 hours apart. Sign in for professional sending: any schedule and more emails.',
      eLidhFillimisht: 'Choose a mailbox to send from first.',
      eHyr: 'Sign in for unlimited use',
      ePreview: 'Preview',
      eParapamje: 'Email preview',
      eNga: 'From',
      ePer: 'To',
      ePergjigjuNe: 'Reply-to',
      eReplyVlera: 'your email (verified when you send)',
      eKompjuter: 'Desktop',
      eTelefon: 'Mobile',
      eMbyll: 'Close',
      eFooterJo: 'Not relevant? Just reply "no" and you will not hear from us again.',
      eCregjistrohu: 'Unsubscribe',
      eGabimStudim: 'Could not study this domain: {e}',
      eB2C: 'This service is built only for B2B businesses. AI thinks {d} sells mainly to consumers (B2C). You can still use the signals on the right.',
      eShembullMarres: 'Example recipient',
      eNjeProve: 'Free: one try per domain. Your email is written by AI from your domain.',
      ePritDomainin: 'Enter your domain and study your business first: AI writes the email from it.',
      ePerdorur: 'Your free try for {d} has ended. Sign in to keep sending, with no limit.',
      sSeShpejti: 'Enter your domain and AI finds people who are looking for what you sell.',
      eDirektoriaSeShpejti: 'The business directory is coming soon.',
      eAsnjeNeKat: 'No more businesses to email in this category. Choose another category.',
      eMarresShembull: 'Example Company',
      pPamja: 'How it will look',
      pPritStudimin: 'Study your business with AI to see your email here.',
      pInbox: 'In the inbox',
      pHapur: 'When opened',
      pTani: '9:00 AM',
      pNgjyra: 'Color',
      pLogo: 'Logo URL (https://…)',
      pMeButon: 'Add a button to your website',
      pButoniTekst: 'Button text',
      pButoniLink: 'Button link',
      pFundiHyr: 'Sending stays 100% free. Sign in to remove the PhronexusAI footer.',
      fDergimMe: 'Powered by PhronexusAI',
      fDergimMe2: 'Send emails, 100% free',
      pDizajnet: 'Design',
      pHiqStickerin: 'Remove the PhronexusAI footer',
      pRedakto: 'Edit design',
      pMbyllRedaktimin: 'Done',
      pEmriDerguesit: 'Sender name',
      eMbetur: '{n} of 3 free emails left for {d}',
      eOfertaMbaroi: 'Your free try for {d} has ended. Sign in to keep sending, with no limit.',
      eRikthim: 'Welcome back. These are the emails from your free try for {d}.',
      eDitetLira: 'Free sending capacity (next 7 days)',
      eDitaPlot: 'full',
      eDitaLira: '{n} free',
      eSot: 'Today',
      eNeser: 'Tomorrow',
      ePlotSot: 'Free sending from our mailboxes is full for today. Sign in and send from your own email, with no limit.',
      eDitaEZgjedhurPlot: 'This day is full. Choose another day.',
      eMaks7: 'You can schedule up to 7 days ahead.',
      stVonuar: 'Delayed',
      pFundiTitulli: 'Sending stays 100% free. To send without the PhronexusAI footer:',
      pFundi1: 'Sign in',
      pFundi2: 'Complete your profile (AI fills it in for you)',
      pFundi3: 'Add the PhronexusAI snippet to your website, so it shows partner ads and brings real views',
      eDukeDerguar: 'Scheduling…',
      eUPlanifikua: 'Scheduled. Each email goes out at its time.',
      eGabimDergimi: 'Could not schedule: {e}',
      eEmailetE: 'Your emails',
      eKolMarresi: 'Recipient',
      eKolOra: 'Scheduled',
      eKolStatusi: 'Status',
      eKolHapur: 'Opened',
      eKolKlikuar: 'Clicked',
      eKolCregj: 'Unsubscribed',
      stNeRadhe: 'Scheduled',
      stDerguar: 'Sent',
      stDeshtoi: 'Not sent',
      eHapur: 'Opened',
      eKlikuar: 'Clicked',
      eShenimHapjet: 'Opens are estimated: some email apps block tracking. Replies go to the sending mailbox.',
    },
    sq: {
      shembull: 'Të dhëna shembull',
      shigjetaMajtas: 'Shfaq sinjalet në gjithë gjerësinë',
      shigjetaDjathtas: 'Shfaq dërgimin në gjithë gjerësinë',
      kokaTeksti: '100% falas',
      sEyebrow: 'Falas · pa regjistrim',
      sPerKe: 'Për biznese B2B dhe B2C',
      sNjeKerkim: 'Falas: një kërkim për domain, postime nga 5 muajt e fundit.',
      sHyr: 'Hyr për të marrë sinjalet më të fundit të interesit për biznesin tënd',
      sTitulli: 'Kush po kërkon atë që shet ti',
      sNen: 'Skanojmë bisedat publike në Reddit, Hacker News, Indie Hackers e të tjera, dhe AI të tregon njerëzit që kanë nevojë për produktin tënd tani.',
      sDomain: 'kompaniajote.com',
      sGjej: 'Bëj provë falas: gjej sinjale interesi me AI',
      sDukeKerkuar: 'Po skanojmë bisedat…',
      sRezultatetPer: 'Rezultatet për',
      sShembullTitulli: 'Rezultate shembull',
      sLloji: 'vendosur nga AI',
      sStatJava: 'sinjale këtë javë',
      sStatTeMira: 'me 80+ pikë',
      sStatBurime: 'burime',
      sFiltri: 'Filtrat',
      sBurimi: 'Burimi',
      sTeGjitha: 'Të gjitha burimet',
      sPikeMin: 'Pikë min.',
      sCdoPike: 'Të gjitha (40+)',
      sPeriudha: 'Periudha',
      sJava: '7 ditët e fundit',
      sMuaji: '30 ditët e fundit',
      sPese: '5 muajt e fundit',
      sShfaqen: 'Po shfaqen {n} sinjale',
      sShfaqen1: 'Po shfaqet 1 sinjal',
      sStatusi: 'Statusi',
      stAll: 'Të gjitha', stNew: 'Të reja', stSaved: 'Të ruajtura', stReplied: 'U përgjigja', stRejected: 'Të refuzuara',
      bSave: 'Ruaj', bReplied: 'U përgjigja', bReject: 'Refuzo',
      bAI: 'Përgjigje me AI', bAIMbetur: '{n} falas',
      aiTitulli: 'Drafti i përgjigjes me AI', aiKopjo: 'Kopjo', aiKopjuar: 'U kopjua', aiShenim: 'Lexoje, ndrysho çfarë do, pastaj postoje vetë.',
      aiDuke: 'AI po shkruan përgjigjen…',
      aiLimitTitulli: 'Përgjigjet me AI mbeten falas. Për t\'i përdorur pa kufi:',
      aiLimitPerfundo: 'Hyr, plotëso profilin (AI e plotëson për ty) dhe shto snippet-in e PhronexusAI në faqen tënde.',
      sPiketTitulli: 'Çfarë tregojnë pikët:',
      sPiketNen: 'AI i jep çdo postimi 0 deri në 100 pikë, sa e mundshme është që autori të ketë nevojë tani për produktin tënd.',
      sPiket80: 'kërkojnë një mjet si yti, shpesh duke përshkruar problemin.',
      sPiket60: 'përshkruajnë pikërisht problemin që zgjidh produkti yt.',
      sPiket40: 'produkti yt mund t\'i ndihmojë, por nuk e kërkojnë.',
      sPiketFsheh: 'Postimet nën 40 pikë fshihen.',
      sStatGjetur: 'postime të kontrolluara nga AI',
      sKonfirmoB2B: 'Mendojmë që klientët e tu janë biznese (B2B). E saktë?',
      sKonfirmoB2C: 'Mendojmë që klientët e tu janë individë (B2C). E saktë?',
      sPo: 'Po',
      sJoIndivide: 'Jo, janë individë',
      sJoBiznese: 'Jo, janë biznese',
      sPerdorur: 'Kërkimi falas për këtë domain është përdorur tashmë.',
      sAsnjeFort: 'Asnjë sinjal i fortë në 5 muajt e fundit.',
      sDukeFilluar: 'Po fillon…',
      sKohaPritjes: 'Zgjat rreth një minutë. Mbaje faqen të hapur.',
      sHape: 'Hape postimin',
      sArsye: 'Pse përputhet',
      sTermat: 'Termat',
      sMbyllur: 'Regjistrohu falas për të parë të {n} sinjalet dhe për të marrë të reja çdo ditë',
      sRegjistrohu: 'Regjistrohu falas',
      sAsnje: 'Asnjë sinjal me këta filtra.',
      eEyebrow: 'Dërgimi i email-eve',
      eTitulli: 'Dërgo nga adresa jote, në kohën e duhur',
      eNen: 'Zgjidh bizneset nga direktoria jonë, shkruaj një herë, dhe lëre të dërgohet në kohën e duhur. Email-et dalin nga adresa jote.',
      eHapi1: 'Lidh email-in tënd',
      eHapi1Nen: 'Email-et dërgohen nga adresa jote, kurrë nga e jona.',
      eTjeter: 'Tjetër (SMTP)',
      eLidhur: 'I lidhur:',
      eHapi2: 'Zgjidh marrësit',
      eKategoria: 'Kategoria',
      eVendi: 'Vendi',
      eTipi: 'Lloji i biznesit',
      eVetemVerifikuar: 'Vetëm biznese me email të verifikuar',
      eGjetur: 'biznese përputhen',
      eHapi3: 'Shkruaj mesazhin',
      eSubjekti: 'Subjekti',
      eSubjektiVlera: 'Një ide e shpejtë për {company}',
      eTrupi: 'Mesazhi',
      eTrupiVlera: 'Përshëndetje ekipi i {company},\n\nAI e shkruan mesazhin këtu pasi të studiojë biznesin tënd.',
      eFusha: 'Shto fushë:',
      eHapi4: 'Planifikimi',
      eData: 'Data e nisjes',
      eOra: 'Ora',
      eLimiti: 'Maks. në ditë',
      eZonaKohore: 'Dërgo sipas orës së çdo marrësi',
      ePlanifiko: 'Planifiko dërgimin',
      eToast: 'Së shpejti.',
      eLigjore: 'Çdo email ka çregjistrim me një klik dhe listë të përbashkët "mos më kontakto".',
      eStatistikat: 'Kjo fushatë',
      eDerguar: 'Dërguar',
      ePergjigje: 'Përgjigje',
      eCregjistruar: 'Çregjistruar',
      eFalas: 'Përfshihet në planin falas',
      eTitulli2: 'Dërgo email-e te bizneset që mund të bëhen klientët e tu',
      eNen2: 'Shkruaj një mesazh, zgjidh bizneset nga direktoria jonë dhe cakto kur niset secili email.',
      eVetemB2B: 'Vetëm për B2B',
      eVetemB2BNen: 'për biznese që u shesin biznesesh të tjera',
      eProvoAI: 'Bëj një provë: gjenero email-in me AI',
      eStudio: 'Shkruaj email-in tim me AI',
      eDomaini: 'kompaniajote.com',
      eDukeStudiuar: 'AI po lexon {d} dhe po shkruan email-in…',
      eStudiuar: 'U krye. AI shkroi subjektin dhe mesazhin dhe zgjodhi kategoritë më të mira për {d}. Mund t\'i ndryshosh të gjitha.',
      eMesazhi: 'Email-i yt',
      eMarresit: 'Marrësit',
      eTeRejat: 'Bizneset më të reja në fillim',
      eRekomanduar: 'Të rekomanduara për {d}',
      eTeGjithaKat: 'Të gjitha kategoritë',
      eZgjedhur: '{n} nga 3 të zgjedhura',
      eShtuar: 'shtuar {n} ditë më parë',
      eOraretTitulli: 'Planifikimi',
      eOraretBosh: 'Zgjidh deri në 3 biznese më sipër për t\'u caktuar orën e email-it.',
      eRregulli: 'Provë falas: deri në 3 email-e, të paktën 4 orë larg njëri-tjetrit.',
      eDergoNga: 'Dërgo nga email-i yt',
      eDergoNgaNen: 'Hyr në Gmail ose Outlook që email-et të dalin nga adresa jote dhe përgjigjet të vijnë te ti. "Tjetër (SMTP)" është për çdo ofrues tjetër email-i, me të dhënat e serverit të tij.',
      eDergo: 'Dërgo',
      eLimit3: 'Prova falas dërgon deri në 3 email-e. Hyr në llogari për të dërguar te më shumë biznese me dërgim profesional.',
      eKufiri4: 'Në provën falas email-et duhet të jenë të paktën 4 orë larg njëri-tjetrit. Hyr në llogari për dërgim profesional: çdo orar dhe më shumë email-e.',
      eLidhFillimisht: 'Zgjidh fillimisht nga cili email do dërgosh.',
      eHyr: 'Hyr për përdorim të pakufizuar',
      ePreview: 'Parapamje',
      eParapamje: 'Parapamja e email-it',
      eNga: 'Nga',
      ePer: 'Për',
      ePergjigjuNe: 'Përgjigjet te',
      eReplyVlera: 'email-i yt (verifikohet kur dërgon)',
      eKompjuter: 'Kompjuter',
      eTelefon: 'Telefon',
      eMbyll: 'Mbyll',
      eFooterJo: 'Not relevant? Just reply "no" and you will not hear from us again.',
      eCregjistrohu: 'Unsubscribe',
      eGabimStudim: 'Domaini nuk u studiua dot: {e}',
      eB2C: 'Ky shërbim është ndërtuar vetëm për biznese B2B. AI mendon se {d} u shet kryesisht individëve (B2C). Sinjalet djathtas mund t\'i përdorësh.',
      eShembullMarres: 'Marrës shembull',
      eNjeProve: 'Falas: një provë për domain. Email-in e shkruan AI nga domaini yt.',
      ePritDomainin: 'Jep domainin dhe studio biznesin fillimisht: AI e shkruan email-in prej tij.',
      ePerdorur: 'Prova falas për {d} ka përfunduar. Hyr në llogari për të vazhduar dërgimin, pa kufi.',
      sSeShpejti: 'Jep domainin dhe AI gjen njerëzit që kërkojnë atë që shet ti.',
      eDirektoriaSeShpejti: 'Direktoria e bizneseve vjen së shpejti.',
      eAsnjeNeKat: 'Nuk ka më biznese për të kontaktuar në këtë kategori. Zgjidh një kategori tjetër.',
      eMarresShembull: 'Kompani Shembull',
      pPamja: 'Si do të duket',
      pPritStudimin: 'Studio biznesin me AI që ta shohësh email-in këtu.',
      pInbox: 'Në kutinë e postës',
      pHapur: 'Kur hapet',
      pTani: '9:00',
      pNgjyra: 'Ngjyra',
      pLogo: 'URL e logos (https://…)',
      pMeButon: 'Shto një buton për faqen tënde',
      pButoniTekst: 'Teksti i butonit',
      pButoniLink: 'Lidhja e butonit',
      pFundiHyr: 'Dërgimi mbetet 100% falas. Hyr në llogari për ta hequr fundin e PhronexusAI.',
      fDergimMe: 'Powered by PhronexusAI',
      fDergimMe2: 'Send emails, 100% free',
      pDizajnet: 'Dizajni',
      pHiqStickerin: 'Hiq fundin e PhronexusAI',
      pRedakto: 'Ndrysho dizajnin',
      pMbyllRedaktimin: 'Mbyll',
      pEmriDerguesit: 'Emri i dërguesit',
      eMbetur: '{n} nga 3 email-e falas të mbetura për {d}',
      eOfertaMbaroi: 'Prova falas për {d} ka përfunduar. Hyr në llogari për të vazhduar dërgimin, pa kufi.',
      eRikthim: 'Mirë se u ktheve. Këto janë email-et e provës falas për {d}.',
      eDitetLira: 'Vende të lira për dërgim falas (7 ditët e ardhshme)',
      eDitaPlot: 'plot',
      eDitaLira: '{n} të lira',
      eSot: 'Sot',
      eNeser: 'Nesër',
      ePlotSot: 'Dërgimi falas nga email-et tona është plot për sot. Hyr në llogari dhe dërgo nga email-i yt, pa kufi.',
      eDitaEZgjedhurPlot: 'Kjo ditë është plot. Zgjidh një ditë tjetër.',
      eMaks7: 'Mund të planifikosh deri në 7 ditë përpara.',
      stVonuar: 'U vonua',
      pFundiTitulli: 'Dërgimi mbetet 100% falas. Për të dërguar pa fundin e PhronexusAI:',
      pFundi1: 'Hyr në llogari',
      pFundi2: 'Plotëso profilin (AI e plotëson për ty)',
      pFundi3: 'Shto snippet-in e PhronexusAI në faqen tënde, që të shfaqë reklamat e partnerëve dhe të sjellë shikime reale',
      eDukeDerguar: 'Po planifikohet…',
      eUPlanifikua: 'U planifikua. Çdo email niset në orën e vet.',
      eGabimDergimi: 'Nuk u planifikua: {e}',
      eEmailetE: 'Email-et e tua',
      eKolMarresi: 'Marrësi',
      eKolOra: 'Planifikuar',
      eKolStatusi: 'Statusi',
      eKolHapur: 'Hapur',
      eKolKlikuar: 'Klikuar',
      eKolCregj: 'Çregjistruar',
      stNeRadhe: 'Në radhë',
      stDerguar: 'Dërguar',
      stDeshtoi: 'Nuk u dërgua',
      eHapur: 'Hapur',
      eKlikuar: 'Klikuar',
      eShenimHapjet: 'Hapjet janë të përafërta: disa programe email-i e bllokojnë gjurmimin. Përgjigjet shkojnë te email-i dërgues.',
    }
  };

  // Sinjalet e verteta vijne nga motori kur te ndertohet kerkimi; tani lista eshte bosh (pa shembuj).
  var SINJALE = []; // mbushet nga rezultatet e kerkimit te vertete (pxseSinjaleNgaServeri)
  var PXSE_BURIMET = { reddit: 'Reddit', ih: 'Indie Hackers', hn: 'Hacker News', se: 'Stack Exchange', alerts: 'Google Alerts' };
  function pxseSinjaleNgaServeri(lista, statuset, pergjigjet) {
    SINJALE.length = 0; statuset = statuset || {}; pergjigjet = pergjigjet || {};
    (lista || []).forEach(function (x) {
      var t0 = Date.parse(x.publikuar || '');
      SINJALE.push({ b: x.burimi, burimi: PXSE_BURIMET[x.burimi] || x.burimi, vendi: x.vendi || '', dite: isNaN(t0) ? null : Math.max(0, Math.floor((Date.now() - t0) / 86400000)),
        pike: Number(x.pike) || 0, titulli: x.titulli || '', teksti: x.teksti || '', arsye: x.arsye || '', url: /^https:\/\//.test(x.url || '') ? x.url : '',
        statusi: statuset[x.url] || 'new', pergjigja: pergjigjet[x.url] || '' });
    });
  }
  // Kategorite dhe bizneset vijne nga direktoria e vertete ne databaze (GET /api/pxse/kategorite dhe /api/pxse/bizneset).
  // Faqja merr vetem emrin dhe domainin e biznesit, kurre adresen e email-it.
  var KATEGORITE = [];
  var BIZNESET = [];

  // Kodi i seances se proves (i rastesishem, ruhet ne shfletues; mbijeton edhe kalimin te Google gjate hyrjes).
  function pxseSeanca() {
    var k = 'pxse_seanca', v = '';
    try { v = localStorage.getItem(k) || ''; } catch (e) {}
    if (!/^[a-f0-9]{32}$/.test(v)) {
      var b = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(b);
      v = Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }

  // Shigjetat (ikona vektoriale, te mprehta ne cdo madhesi ekrani)
  var SVG_MAJTAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  var SVG_DJATHTAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var SVG_HYRJE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>';

  var CSS = [
    ':host{',
    // ---- Ngjyrat dhe stili (ndryshoji ketu, ose nga jashte me --px-... ) ----
    '  --px-sfondi-sinjale:#e3e9f2; --px-sfondi-email:#eff3f8;',
    '  --px-sfondi:#ffffff; --px-siperfaqja:#f6f7fb; --px-kufiri:#e4e6ef; --px-teksti:#141625; --px-zbehur:#62667a;',
    '  --px-theks:#4f46e5; --px-theks-teksti:#ffffff; --px-theks-lehte:#eef0ff; --px-sukses:#0f9d6b; --px-paralajmerim:#c27803;',
    '  --px-rrezja:14px; --px-rrezja-vogel:9px; --px-hija:0 1px 2px rgba(20,22,37,.06),0 8px 24px rgba(20,22,37,.06);',
    '  --px-font:inherit; --px-lartesia:620px;',
    '  display:block; color:var(--px-teksti); font-family:var(--px-font); font-size:14px; line-height:1.5;',
    '}',
    '*,*::before,*::after{box-sizing:border-box}',
    'button,input,select,textarea{font:inherit;color:inherit}',
    // e gjere sa ekrani, pa kornize "tabele"; ngjyra e sfondit ndan dy seksionet
    '.px{position:relative;background:var(--px-sfondi);overflow:clip;display:flex;flex-direction:column;height:var(--px-lartesia)}',
    // Koka e perbashket "100% free": e dukshme, vlen per te dy sherbimet
    '.px-koka{padding:10px 20px;text-align:center;background:var(--px-sfondi);border-bottom:1px solid var(--px-kufiri)}',
    '.px-koka span{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:999px;background:var(--px-theks);color:var(--px-theks-teksti);font-size:17px;font-weight:800;letter-spacing:.03em;box-shadow:0 4px 14px rgba(79,70,229,.25)}',
    '.px-pjesa-email{background:var(--px-sfondi-email)}',
    '.px-pjesa-sinjale{background:var(--px-sfondi-sinjale)}',
    '.px-korniza{display:flex;flex:1 1 auto;min-height:0}',
    '.px-pjesa{flex:0 0 calc(50% - 36px);min-width:0;overflow:hidden;container-type:inline-size;transition:flex-basis .45s cubic-bezier(.4,0,.2,1),opacity .3s ease}',
    '.px[data-gjendja="majte"] .px-pjesa-majte,.px[data-gjendja="djathte"] .px-pjesa-djathte{flex-basis:calc(100% - 72px)}',
    '.px[data-gjendja="majte"] .px-pjesa-djathte,.px[data-gjendja="djathte"] .px-pjesa-majte{flex-basis:0;opacity:0;height:0;align-self:flex-start}',
    // pjesa e zgjeruar: lartesia sa permbajtja, pa shirit levizje te brendshem; leviz faqja (shigjeta mbetet ne mes te ekranit)
    '.px:not([data-gjendja="ndare"]){height:auto}',
    '.px:not([data-gjendja="ndare"]) .px-brenda{height:auto;overflow:visible}',
    '.px:not([data-gjendja="ndare"]) .px-ndaresi{justify-content:flex-start}',
    '.px:not([data-gjendja="ndare"]) .px-shigjetat{position:sticky;top:calc(50vh - 15px);margin-top:min(35vh, 300px)}',
    '.px-brenda{padding:20px;min-width:300px;height:100%;overflow-y:auto}',
    // ndaresi me shigjeta
    // pamja:  ‹ | ›   (vija ndarese ne mes, nje shigjete ne secilen ane, ne mes te lartesise)
    '.px-ndaresi{position:relative;flex:0 0 72px;background:linear-gradient(to right,var(--px-sfondi-email) 50%,var(--px-sfondi-sinjale) 50%);display:flex;flex-direction:column;justify-content:center;align-items:center}',
    '.px-ndaresi::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:1px;transform:translateX(-50%);background:var(--px-kufiri)}',
    '.px-shigjetat{position:relative;display:flex;align-items:center;gap:16px}',
    '.px-shigjeta{width:30px;height:30px;padding:0;border-radius:50%;border:1px solid var(--px-kufiri);background:var(--px-sfondi);color:var(--px-zbehur);cursor:pointer;display:grid;place-items:center;box-shadow:0 1px 2px rgba(20,22,37,.08),0 2px 8px rgba(20,22,37,.06);transition:color .15s,border-color .15s,box-shadow .15s,transform .15s}',
    '.px-shigjeta svg{width:16px;height:16px;display:block}',
    '.px-shigjeta:hover{color:var(--px-theks);border-color:var(--px-theks);box-shadow:0 0 0 3px var(--px-theks-lehte)}',
    '.px-shigjeta:active{transform:scale(.94)}',
    '.px-shigjeta:focus-visible{outline:2px solid var(--px-theks);outline-offset:2px}',
    '.px-shigjeta[hidden]{display:grid;visibility:hidden}',
    // tipografia
    '.px-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--px-theks);background:var(--px-theks-lehte);padding:3px 9px;border-radius:999px}',
    'h2{font-size:20px;line-height:1.25;margin:8px 0 4px;letter-spacing:-.01em}',
    '.px-nen{color:var(--px-zbehur);margin:0 0 12px;max-width:60ch}',
    '.px-shembull{font-size:11px;color:var(--px-zbehur);border:1px dashed var(--px-kufiri);border-radius:999px;padding:2px 8px;margin-left:6px;text-transform:none;letter-spacing:0;font-weight:500;background:transparent}',
    // forma
    '.px-rresht{display:flex;gap:8px;flex-wrap:wrap}',
    '.px-input,.px-select,.px-textarea{background:var(--px-sfondi);border:1px solid var(--px-kufiri);border-radius:var(--px-rrezja-vogel);padding:8px 10px;min-width:0}',
    '.px-input:focus,.px-select:focus,.px-textarea:focus{outline:none;border-color:var(--px-theks);box-shadow:0 0 0 3px var(--px-theks-lehte)}',
    '.px-input{flex:1 1 200px}',
    '.px-textarea{width:100%;min-height:260px;resize:vertical;line-height:1.55;overflow:hidden}',
    '.px-buton{background:var(--px-theks);color:var(--px-theks-teksti);border:0;border-radius:var(--px-rrezja-vogel);padding:8px 14px;font-weight:600;cursor:pointer;transition:filter .15s}',
    '.px-buton:hover{filter:brightness(1.08)}',
    '.px-buton:focus-visible{outline:2px solid var(--px-theks);outline-offset:2px}',
    '.px-buton-dyte{background:var(--px-sfondi);color:var(--px-teksti);border:1px solid var(--px-kufiri)}',
    '.px-buton-dyte:hover{border-color:var(--px-theks);filter:none}',
    '.px-buton-dyte[aria-pressed="true"]{border-color:var(--px-theks);background:var(--px-theks-lehte)}',
    'label.px-etiketa{display:block;font-size:12px;font-weight:600;color:var(--px-zbehur);margin:0 0 4px}',
    '.px-kontroll{display:flex;align-items:center;gap:8px;font-size:14px;margin-top:10px}',
    // sinjalet
    '.px-info{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:18px 0 10px}',
    '.px-info strong{font-size:14px}',
    '.px-lloji{font-size:12px;border:1px solid var(--px-kufiri);border-radius:999px;padding:3px 10px;color:var(--px-zbehur)}',
    '.px-lloji b{color:var(--px-teksti)}',
    '.px-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}',
    '.px-stat div{background:var(--px-siperfaqja);border-radius:var(--px-rrezja-vogel);padding:10px 12px}',
    '.px-stat b{display:block;font-size:20px;line-height:1.1}',
    '.px-stat span{font-size:12px;color:var(--px-zbehur)}',
    '.px-filtrat{display:none;gap:8px;margin-bottom:12px;flex-wrap:wrap}',
    '.px-filtrat > div{flex:1 1 150px}',
    '.px-filtrat .px-select{width:100%}',
    '.px-lista{display:grid;gap:30px 10px;padding-bottom:16px}',
    '.px-karta{position:relative;border:1px solid var(--px-kufiri);border-radius:var(--px-rrezja-vogel);padding:14px 14px 26px;background:var(--px-sfondi);cursor:pointer;transition:border-color .15s,box-shadow .15s}',
    '.px-karta:hover{border-color:var(--px-theks);box-shadow:0 6px 18px rgba(20,22,37,.08)}',
    '.px-karta:focus-visible{outline:2px solid var(--px-theks);outline-offset:2px}',
    '.px-karta-rejected{opacity:.62}',
    '.px-karta-replied{border-color:#b7e4c7}',
    '.px-karta-saved{border-color:#f3d38a}',
    // butonat qe mbulojne kufirin poshte majtas
    '.px-sj-veprime{position:absolute;left:12px;bottom:-15px;display:flex;gap:6px;flex-wrap:wrap;max-width:calc(100% - 24px)}',
    '.px-sj-b{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--px-kufiri);background:var(--px-sfondi);color:var(--px-teksti);font:600 12px/1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 2px 6px rgba(20,22,37,.08);transition:all .15s;white-space:nowrap}',
    '.px-sj-b:hover{border-color:var(--px-theks);color:var(--px-theks);transform:translateY(-1px)}',
    '.px-sj-saved.px-aktiv{background:#fff4d6;border-color:#f3d38a;color:#8a5a00}',
    '.px-sj-replied.px-aktiv{background:#e6f6ec;border-color:#b7e4c7;color:#17733a}',
    '.px-sj-rejected.px-aktiv{background:#f1f2f4;border-color:#d0d4da;color:#5b6472}',
    '.px-sj-ai{background:linear-gradient(135deg,var(--px-theks),#7c3aed);border-color:transparent;color:#fff}',
    '.px-sj-ai:hover{color:#fff;border-color:transparent;filter:brightness(1.06)}',
    '.px-sj-ai[disabled]{opacity:.7;cursor:progress;transform:none}',
    '.px-sj-mbetur{font-weight:500;font-size:11px;background:rgba(255,255,255,.22);border-radius:999px;padding:2px 7px}',
    '.px-ai-kuti{cursor:auto;margin:8px 0 10px;padding:10px 12px;border-radius:10px;background:linear-gradient(180deg,#f5f3ff,#eef2ff);border:1px solid #dcd6ff;font-size:13px;color:var(--px-teksti)}',
    '.px-ai-koka{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}',
    '.px-ai-koka b{font-size:12px;color:#5b3fd6;text-transform:uppercase;letter-spacing:.04em}',
    '.px-ai-tekst{display:block;width:100%;box-sizing:border-box;min-height:120px;resize:vertical;white-space:pre-wrap;line-height:1.55;font:inherit;font-size:13px;color:var(--px-teksti);background:#fff;border:1px solid #dcd6ff;border-radius:8px;padding:8px 10px;cursor:text}',
    '.px-ai-tekst:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.15)}',
    '.px-ai-kuti small{display:block;margin-top:6px;color:var(--px-zbehur);font-size:11px}',
    '.px-ai-kopjo{height:26px;padding:0 12px;border-radius:999px;border:1px solid #c9c0ff;background:#fff;color:#5b3fd6;font:600 12px/1 inherit;font-family:inherit;cursor:pointer}',
    '.px-ai-kopjo:hover{background:#5b3fd6;color:#fff}',
    '.px-ai-kopjo.px-kopjuar{background:#17733a;border-color:#17733a;color:#fff}',
    '.px-karta-koka{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:var(--px-zbehur);margin-bottom:6px}',
    '.px-pike{font-weight:700;font-size:12px;border-radius:999px;padding:2px 9px;white-space:nowrap}',
    '.px-pike-larte{background:#e7f7f0;color:var(--px-sukses)}',
    '.px-pike-mesme{background:#fff4e0;color:var(--px-paralajmerim)}',
    '.px-pike-ulet{background:var(--px-siperfaqja);color:var(--px-zbehur)}',
    '.px-karta h3{font-size:14px;line-height:1.35;margin:0 0 6px}',
    '.px-karta p{margin:0 0 8px;color:var(--px-zbehur);font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.px-arsye{font-size:13px;background:var(--px-theks-lehte);border-radius:8px;padding:6px 10px;margin-bottom:8px}',
    '.px-termat{display:none;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
    '.px-termat span{font-size:12px;border:1px solid var(--px-kufiri);border-radius:999px;padding:1px 8px;color:var(--px-zbehur)}',
    '.px-lidhje{font-size:13px;font-weight:600;color:var(--px-theks);text-decoration:none}',
    '.px-lidhje:hover{text-decoration:underline}',
    '.px-mbyllur{position:relative}',
    '.px-mbyllur .px-lista{filter:blur(5px);pointer-events:none;user-select:none}',
    '.px-mbyllur-cta{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px;background:linear-gradient(to bottom,rgba(255,255,255,0),var(--px-sfondi) 40%)}',
    '.px-mbyllur-cta p{margin:0;font-weight:600;max-width:42ch}',
    '.px-bosh{color:var(--px-zbehur);font-size:14px;padding:12px 0}',
    '.px-numri-sinjaleve{margin:4px 0 10px;font-size:14px;font-weight:600}',
    '.px-piket-shpjegim{font-size:13px;line-height:1.5;color:var(--px-zbehur);background:var(--px-siperfaqja);border-radius:var(--px-rrezja-vogel);padding:10px 12px;margin:0 0 12px}',
    '.px-piket-shpjegim b{color:var(--px-teksti)}',
    '.px-piket-shpjegim ul{list-style:none;margin:6px 0;padding:0;display:grid;gap:4px}',
    '.px-piket-shpjegim .px-pike{display:inline-block;min-width:58px;text-align:center;margin-right:6px}',
    '.px-rrotull{display:inline-block;width:12px;height:12px;border:2px solid var(--px-kufiri);border-top-color:var(--px-theks);border-radius:50%;animation:px-rr 0.8s linear infinite;vertical-align:-1px}',
    '@keyframes px-rr{to{transform:rotate(360deg)}}',
    '.px-ngarkim{color:var(--px-zbehur);font-size:14px;padding:16px 0}',
    // email-et
    '.px-hapat{display:grid;gap:12px}',
    '.px-hapi{border:1px solid var(--px-kufiri);border-radius:var(--px-rrezja-vogel);padding:13px;background:var(--px-sfondi)}',
    '.px-hapi-koka{display:flex;align-items:center;gap:10px;margin-bottom:10px}',
    '.px-nr{width:24px;height:24px;border-radius:50%;background:var(--px-theks);color:var(--px-theks-teksti);display:grid;place-items:center;font-size:12px;font-weight:700;flex:0 0 auto}',
    '.px-hapi-koka h3{margin:0;font-size:14px}',
    '.px-hapi-nen{font-size:13px;color:var(--px-zbehur);margin:-4px 0 10px 34px}',
    '.px-lidhur{font-size:13px;color:var(--px-sukses);margin-top:8px}',
    '.px-numri{font-size:13px;margin-top:10px}',
    '.px-numri b{font-size:18px}',
    '.px-fushat{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--px-zbehur);margin:8px 0}',
    '.px-fusha{border:1px dashed var(--px-kufiri);background:var(--px-siperfaqja);border-radius:6px;padding:2px 8px;cursor:pointer;font-size:12px}',
    '.px-fusha:hover{border-color:var(--px-theks)}',
    '.px-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.px-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.px-grid-2 .px-input,.px-grid-3 .px-input,.px-grid-2 .px-select,.px-grid-3 .px-select{width:100%}',
    '.px-zgjeruar{display:none}',
    '.px-tabela-mbajtese{overflow-x:auto}',
    '.px-tabela{width:100%;border-collapse:collapse;font-size:13px}',
    '.px-tabela th{text-align:left;font-weight:600;color:var(--px-zbehur);font-size:12px;padding:6px 8px;border-bottom:1px solid var(--px-kufiri);white-space:nowrap}',
    '.px-tabela td{padding:8px;border-bottom:1px solid var(--px-kufiri);vertical-align:top;white-space:nowrap}',
    '.px-tabela td small{display:block;color:var(--px-zbehur);font-size:12px}',
    '.px-st{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;background:var(--px-siperfaqja)}',
    '.px-st-derguar{background:#e6f6ec;color:#17733a}',
    '.px-st-deshtoi{background:#fdecec;color:#b42318}',
    '.px-po{color:#17733a;font-weight:700}',
    '.px-jo{color:var(--px-zbehur)}',
    '.px-veprimi{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}',
    '.px-shenim{font-size:12px;color:var(--px-zbehur);margin-top:10px}',
    '.px-falas{font-size:12px;color:var(--px-sukses);font-weight:600}',
    '.px-toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%) translateY(10px);background:var(--px-teksti);color:var(--px-sfondi);padding:10px 16px;border-radius:999px;font-size:14px;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}',
    '.px-toast.px-shfaq{opacity:1;transform:translateX(-50%) translateY(0)}',
    '.px-statistika{display:none;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}',
    '.px-statistika div{background:var(--px-siperfaqja);border-radius:var(--px-rrezja-vogel);padding:10px 12px}',
    '.px-statistika b{display:block;font-size:20px}',
    '.px-statistika span{font-size:12px;color:var(--px-zbehur)}',
    // email-et (versioni i ri)
    '.px-b2b{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:5px 12px;border-radius:999px;background:var(--px-theks);color:var(--px-theks-teksti);font-weight:700;font-size:13px}',
    '.px-b2b small{font-weight:500;opacity:.85;font-size:12px}',
    '.px-veprimet-siper{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap;margin-bottom:12px}',
    '.px-provo{flex:1 1 240px;padding:12px 16px}',
    '.px-veprimet-siper .px-studio{flex:1 1 380px;margin:0}',
    '.px-hyrje{flex:0 1 auto;max-width:100%;white-space:normal;text-align:left;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:8px 14px;border-radius:var(--px-rrezja-vogel);border:1px solid var(--px-teksti);background:var(--px-teksti);color:var(--px-sfondi);font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(20,22,37,.12),0 4px 12px rgba(20,22,37,.10);transition:transform .15s,box-shadow .15s}',
    '.px-hyrje svg{width:17px;height:17px;flex:0 0 auto}',
    '.px-hyrje svg:last-child{width:15px;height:15px;opacity:.7;transition:transform .15s}',
    '.px-hyrje:hover{box-shadow:0 2px 4px rgba(20,22,37,.14),0 8px 20px rgba(20,22,37,.16)}',
    '.px-hyrje:hover svg:last-child{transform:translateX(3px)}',
    '.px-hyrje:focus-visible{outline:2px solid var(--px-theks);outline-offset:2px}',
    '.px-paralajmero .px-hyrje{padding:9px 14px}',
    '.px-studio-stat.px-keq{color:#b42318}',
    '.px-keq{color:#b42318;font-size:12px}',
    '.px-gabim-i-forte{background:#fdecec;border:1px solid #f5c2c0;border-radius:8px;padding:8px 12px;font-weight:600}',
    '.px-ditet{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}',
    '.px-dita{display:inline-flex;flex-direction:column;font-size:12px;line-height:1.3;padding:5px 9px;border-radius:8px;background:#e6f6ec;color:#17733a}',
    '.px-dita b{font-weight:600}',
    '.px-dita-plot{background:#fdecec;color:#b42318}',
    '.px-kushtet{margin:0;padding-left:20px;flex:1 1 100%;line-height:1.6}',
    '.px-st-vonuar{background:#fff7e8;color:#9a5b00}',
    // parapamja e email-it
    '.px-modal{position:fixed;inset:0;background:rgba(15,18,30,.55);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;z-index:2147483000}',
    '.px-modal-kuti{background:var(--px-sfondi);border-radius:var(--px-rrezja);box-shadow:0 20px 60px rgba(0,0,0,.25);width:min(760px,100%);overflow:hidden}',
    '.px-modal-koka{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:1px solid var(--px-kufiri);flex-wrap:wrap}',
    '.px-modal-koka h3{margin:0;font-size:16px}',
    '.px-modal-veprime{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
    '.px-modal-veprime .px-buton{padding:7px 12px;font-size:13px}',
    '.px-modal-trup{background:#f1f3f6;padding:24px 16px;display:flex;justify-content:center}',
    '.px-postieri{background:#fff;color:#202124;width:100%;max-width:640px;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.12);transition:max-width .25s;font-family:Arial,Helvetica,sans-serif}',
    '.px-postieri.px-mobil{max-width:360px}',
    '.px-postieri-koka{padding:16px 20px 12px;border-bottom:1px solid #eceff3;font-size:13px;color:#5f6368;line-height:1.6}',
    '.px-postieri-koka b{color:#202124;font-weight:600}',
    '.px-postieri-subjekti{font-size:19px;color:#202124;margin:0 0 8px;font-weight:600;line-height:1.3}',
    '.px-postieri-mesazhi{padding:18px 20px 8px;font-size:15px;line-height:1.6;color:#202124}',
    '.px-postieri-mesazhi p{margin:0 0 14px}',
    '.px-postieri-firma{margin:6px 20px 0;padding:12px 0 14px;border-top:1px solid #eceff3;font-size:13px;color:#5f6368;line-height:1.5}',
    '.px-postieri-firma b{color:#202124}',
    '.px-postieri-fundi{padding:0 20px 18px;font-size:12px;color:#80868b;line-height:1.5}',
    '.px-postieri-fundi a{color:#80868b}',
    '.px-studio{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}',
    '.px-studio .px-input{flex:1 1 220px}',
    // fusha + butoni ngjitur si nje bllok i vetem
    '.px-studio-bashke{flex-wrap:nowrap;gap:0}',
    '.px-studio-bashke .px-input{border-top-right-radius:0;border-bottom-right-radius:0;border-right:0;min-width:0}',
    '.px-studio-bashke .px-buton{border-top-left-radius:0;border-bottom-left-radius:0;white-space:nowrap}',
    '.px-hyrje-rresht{margin:4px 0 22px;padding-top:14px;border-top:1px dashed var(--px-kufiri)}',
    '.px-studio-stat{font-size:13px;color:var(--px-zbehur);margin:0 0 10px}',
    '.px-studio-stat.px-ok{color:var(--px-sukses)}',
    '.px-email-rreshti{display:grid;grid-template-columns:1fr;gap:12px;align-items:start;margin-bottom:12px}',
    '.px-bizneset{display:grid;gap:6px;margin-top:10px;max-height:260px;overflow-y:auto}',
    '.px-biznes{display:flex;align-items:center;gap:10px;border:1px solid var(--px-kufiri);border-radius:8px;padding:8px 10px;background:var(--px-sfondi);cursor:pointer;font-size:14px}',
    '.px-biznes:has(input:checked){border-color:var(--px-theks);background:var(--px-theks-lehte)}',
    '.px-biznes span{flex:1;min-width:0}',
    '.px-biznes small{display:block;color:var(--px-zbehur);font-size:12px}',
    '.px-biznes em{font-style:normal;font-size:12px;color:var(--px-zbehur);white-space:nowrap}',
    '.px-numerues{font-size:13px;font-weight:600;margin-top:8px}',
    '.px-orari{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px dashed var(--px-kufiri);font-size:14px}',
    '.px-orari:first-of-type{border-top:0}',
    '.px-orari b{flex:1 1 140px}',
    '.px-orari .px-input{flex:0 1 230px}',
    '.px-orari.px-gabim .px-input{border-color:#d93a3a}',
    '.px-paralajmero{border:1px solid #f1c27d;background:#fff7e8;border-radius:var(--px-rrezja-vogel);padding:12px 14px;margin-top:10px;font-size:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}',
    '.px-paralajmero p{margin:0;flex:1 1 240px}',
    // parapamja e drejtperdrejte (vetem ne versionin e gjere)
    '.px-pamja-koka{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}',
    '.px-etiketa-vogel{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--px-zbehur);margin:12px 0 6px}',
    '.px-inbox{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e3e6ea;border-radius:8px;padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#202124;min-width:0}',
    '.px-inbox-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;flex:0 0 auto}',
    '.px-inbox-teksti{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.px-inbox-teksti b{font-weight:700}',
    '.px-inbox-teksti span{color:#5f6368}',
    '.px-inbox-ora{font-size:12px;color:#5f6368;flex:0 0 auto}',
    '.px-hapur{background:#f1f3f6;border-radius:8px;padding:12px;overflow:hidden}',
    '.px-hapur-koka{background:#fff;border-radius:8px 8px 0 0;padding:12px 14px;border-bottom:1px solid #eceff3;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#5f6368;line-height:1.6}',
    '.px-hapur-koka b{color:#202124}',
    '.px-hapur-trupi{background:#fff;border-radius:0 0 8px 8px;padding:14px;overflow-x:auto}',
    '.px-dizajn-kontrollet{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}',
    '.px-dizajn-kontrollet .px-input{width:100%}',
    '.px-dizajn-kontrollet input[type=color]{width:100%;height:42px;padding:3px;border:1px solid var(--px-kufiri);border-radius:var(--px-rrezja-vogel);background:var(--px-sfondi)}',
    '.px-redakto{display:inline-flex;align-items:center;gap:8px;border:0;background:var(--px-theks);border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;color:var(--px-theks-teksti);box-shadow:0 4px 12px rgba(79,70,229,.30);transition:transform .15s,box-shadow .15s}',
    '.px-redakto:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(79,70,229,.38)}',
    '.px-redakto[aria-expanded="true"]{background:var(--px-teksti);box-shadow:0 4px 12px rgba(20,22,37,.25)}',
    '.px-redakto-ngj{width:14px;height:14px;border-radius:50%;box-shadow:0 0 0 2px #fff}',
    '.px-redakto-shigj{font-size:11px}',
    '.px-redaktori{border:1px solid var(--px-kufiri);border-radius:var(--px-rrezja-vogel);padding:12px;margin-bottom:12px;background:var(--px-siperfaqja)}',
    '.px-galeria{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:6px}',
    '.px-dz{position:relative;padding:0;border:2px solid var(--px-kufiri);border-radius:9px;background:#fff;cursor:pointer;overflow:hidden;height:96px}',
    '.px-dz[aria-checked="true"]{border-color:var(--px-theks);box-shadow:0 0 0 3px var(--px-theks-lehte)}',
    '.px-dz:hover{border-color:var(--px-theks)}',
    '.px-dz-pamja{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
    '.px-dz-brenda{display:block;width:600px;transform:scale(.2);transform-origin:top left}',
    '.px-dz-nr{position:absolute;left:5px;bottom:5px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--px-teksti);color:var(--px-sfondi);font-size:11px;font-weight:700;display:grid;place-items:center}',
    '.px-dz[aria-checked="true"] .px-dz-nr{background:var(--px-theks)}',
    '@container (max-width: 520px){ .px-galeria{grid-template-columns:repeat(3,minmax(0,1fr))} }',
    '.px-sticker-x{position:absolute;top:-9px;right:-9px;width:22px;height:22px;border-radius:50%;border:1px solid #d5d9e0;background:#fff;color:#5b6472;font-size:12px;line-height:1;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.15);display:grid;place-items:center;padding:0}',
    '.px-sticker-x:hover{color:#b42318;border-color:#b42318}',
    '.px-fundi-kontroll{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--px-zbehur);margin-top:8px}',
    '.px-fundi-kontroll button{border:1px solid var(--px-kufiri);background:var(--px-sfondi);border-radius:999px;padding:3px 10px;font-size:12px;cursor:pointer}',
    '.px-fundi-kontroll button:hover{border-color:var(--px-theks);color:var(--px-theks)}',
    '.px-pjesa[data-zgjeruar] .px-vetem-ngushte{display:none}',
    '.px-pjesa:not([data-zgjeruar]) .px-vetem-gjere{display:none}',
    '.px-buton:disabled{opacity:.5;cursor:not-allowed;filter:none}',
    '.px-input[readonly],.px-textarea[readonly]{background:var(--px-siperfaqja);color:var(--px-zbehur);cursor:not-allowed}',
    '.px-fusha:disabled{opacity:.5;cursor:not-allowed}',
    '@container (min-width: 760px){ .px-pjesa[data-zgjeruar] .px-email-rreshti{grid-template-columns:minmax(0,1fr) minmax(0,1fr)} }',
    '.px-email-rreshti > *{min-width:0}',
    // pershtatja me gjeresine e pjeses (opsionet shtese kur zgjerohet)
    '@container (min-width: 700px){',
    '  .px-filtrat{display:flex}',
    '  .px-termat{display:flex}',
    '  .px-karta p{-webkit-line-clamp:4}',
    '  .px-zgjeruar{display:block}',
    '  .px-statistika{display:grid}',
    '  .px-brenda{padding:22px 32px}',
    '}',
    '@container (min-width: 980px){',
    '  .px-lista{grid-template-columns:1fr 1fr}',
    '  .px-hapat{grid-template-columns:1fr 1fr}',
    '  .px-hapi-gjere{grid-column:1 / -1}',
    '}',
    '@container (max-width: 420px){',
    '  .px-stat{grid-template-columns:1fr 1fr}',
    '  .px-grid-3{grid-template-columns:1fr 1fr}',
    '  .px-brenda{padding:20px}',
    '}',
    // Telefon: ndaresi me i ngushte dhe pa gjeresi minimale, qe permbajtja te mos pritet ne skajin e djathte.
    '@media (max-width: 640px){',
    '  .px-ndaresi{flex-basis:44px}',
    '  .px[data-gjendja="majte"] .px-pjesa-majte,.px[data-gjendja="djathte"] .px-pjesa-djathte{flex-basis:calc(100% - 44px)}',
    '  .px-brenda{min-width:0;padding:20px 14px}',
    '  .px-shigjetat{gap:6px}',
    '}',
    '@media (prefers-reduced-motion: reduce){.px-pjesa,.px-shigjeta,.px-toast{transition:none}}'
  ].join('\n');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // Analitika e admin-it: hyrja ne faqe, klikimi i ✕ te stickerit dhe i "Sign in" (pa te dhena personale).
  function pxseNgjarje(api, lloji, nga, burimi) {
    try { fetch(api + '/ngjarje', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seanca: pxseSeanca(), lloji: lloji, nga: nga || 'email', burimi: burimi || undefined }) }).catch(function () {}); } catch (e) {}
  }

  function PxSinjaleEmail() { return Reflect.construct(HTMLElement, [], PxSinjaleEmail); }
  PxSinjaleEmail.prototype = Object.create(HTMLElement.prototype);
  PxSinjaleEmail.prototype.constructor = PxSinjaleEmail;
  Object.setPrototypeOf(PxSinjaleEmail, HTMLElement);
  PxSinjaleEmail.observedAttributes = ['lang'];

  PxSinjaleEmail.prototype.connectedCallback = function () {
    if (!this._rrenja) {
      this._rrenja = this.attachShadow({ mode: 'open' });
      this._gjendja = 'ndare';          // 'ndare' | 'majte' | 'djathte'
      this._domaini = '';
      this._filtri = { burimi: '', min: 40, dite: 150, statusi: 'new' }; // shfaqen vetem rezultatet me 40+ pike nga AI; paracaktim 5 muaj
      this._sj = { gjendja: '', hapi: '', gabim: '', lloji: '', numri: 0, domaini: '' }; // gjendja e kerkimit te sinjaleve
      this._lidhur = '';
      this._kategoria = ''; // '' = te gjitha kategorite (me te rejat ne fillim)
      // gjendja e seksionit te email-eve
      this._em = { domaini: '', studim: '', subjekti: null, trupi: null, rekomanduar: [], zgjedhur: [], oret: {}, njoftim: '',
        marka: '', hapurDizajni: false, dergimet: [], mbetur: null, dergimi: '', gabimDergimi: '', bizCache: {}, ditet: [], rikthim: false,
        dizajn: { id: '2', ngjyra: '#3b6ef0', logo: '', meButon: true, butoniTekst: '', butoniLink: '' } };
      var selfL = this;
      this._neResize = function () { selfL._lartesia(); };
      window.addEventListener('resize', this._neResize);
      this._ngarkoKategorite();
      pxseNgjarje(this._api(), 'vizite');
    }
    // Ne ekrane te ngushta (telefon) 50/50 eshte shume ngushte: fillon me pjesen e majte te plote.
    var gj0 = this.getBoundingClientRect().width;
    if (gj0 > 0 && gj0 < 640 && this._gjendja === 'ndare') this._gjendja = 'majte';
    this._vizato();
    var self = this;
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(function (h) {
        var w = h[0].contentRect.width;
        if (w > 0 && w < 640 && self._gjendja === 'ndare') { self._gjendja = 'majte'; self._apliko(); }
        self._lartesia();
      });
      this._ro.observe(this);
    }
  };
  PxSinjaleEmail.prototype.disconnectedCallback = function () { if (this._ro) { this._ro.disconnect(); this._ro = null; } };
  PxSinjaleEmail.prototype.attributeChangedCallback = function () { if (this._rrenja) this._vizato(); };

  PxSinjaleEmail.prototype._t = function (k) {
    var g = (this.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
    return (TEKSTET[g] || TEKSTET.en)[k];
  };
  PxSinjaleEmail.prototype._gjuha = function () { return (this.getAttribute('lang') || 'en').toLowerCase().slice(0, 2) === 'sq' ? 'sq' : 'en'; };

  PxSinjaleEmail.prototype._htmlSinjalet = function () {
    var t = this._t.bind(this), f = this._filtri, gj = this._gjuha();
    var sj = this._sj;
    var lista = SINJALE.filter(function (s) {
      return s.pike >= 40 && (!f.burimi || s.burimi === f.burimi) && s.pike >= f.min && (f.statusi === 'all' || s.statusi === f.statusi); // pa filter periudhe
    }).sort(function (a, b) { return b.pike - a.pike; });
    var burimet = Array.from(new Set(SINJALE.map(function (s) { return s.burimi; })));
    var karta = function (s) {
      var klasa = s.pike >= 80 ? 'px-pike-larte' : (s.pike >= 60 ? 'px-pike-mesme' : 'px-pike-ulet');
      var st = function (k, tekst, ikona) { return '<button type="button" class="px-sj-b px-sj-' + k + (s.statusi === k ? ' px-aktiv' : '') + '" data-st="' + k + '" aria-pressed="' + (s.statusi === k) + '">' + ikona + ' ' + esc(tekst) + '</button>'; };
      var duke = sj.aiDuke === s.url;
      var aiBtn = '<button type="button" class="px-sj-b px-sj-ai" data-ai' + (duke ? ' disabled' : '') + '>✦ ' + esc(t('bAI')) +
        (!s.pergjigja && sj.aiMbetur > 0 ? ' <span class="px-sj-mbetur">' + esc(t('bAIMbetur').replace('{n}', sj.aiMbetur)) + '</span>' : '') + '</button>';
      var kuti = duke ? '<div class="px-ai-kuti"><span class="px-rrotull" aria-hidden="true"></span> ' + esc(t('aiDuke')) + '</div>' :
        (s.pergjigja ? '<div class="px-ai-kuti"><div class="px-ai-koka"><b>✦ ' + esc(t('aiTitulli')) + '</b><button type="button" class="px-ai-kopjo" data-kopjo>' + esc(t('aiKopjo')) + '</button></div>' +
          '<textarea class="px-ai-tekst" data-ai-tekst rows="6" spellcheck="true" aria-label="' + esc(t('aiTitulli')) + '">' + esc(s.pergjigja) + '</textarea><small>' + esc(t('aiShenim')) + '</small></div>' : '') +
        (sj.aiGabim && sj.aiGabim.url === s.url ? '<p class="px-studio-stat px-keq" style="margin:6px 0 0">' + esc(sj.aiGabim.teksti) + '</p>' : '');
      return '<article class="px-karta px-karta-' + esc(s.statusi) + '" data-url="' + esc(s.url) + '" data-b="' + esc(s.b || '') + '" tabindex="0">' +
        '<div class="px-karta-koka"><span>' + esc(s.burimi) + (s.vendi && s.vendi !== s.burimi ? ' · ' + esc(s.vendi) : '') + (s.dite !== null ? ' · ' + s.dite + 'd' : '') + '</span><span class="px-pike ' + klasa + '">' + s.pike + '/100</span></div>' +
        '<h3>' + esc(s.titulli) + '</h3><p>' + esc(s.teksti) + '</p>' +
        (s.arsye ? '<div class="px-arsye"><b>' + esc(t('sArsye')) + ':</b> ' + esc(s.arsye) + '</div>' : '') +
        kuti +
        (s.url ? '<a class="px-lidhje" data-burimi="' + esc(s.b || '') + '" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer nofollow">' + esc(t('sHape')) + ' →</a>' : '') +
        // butonat qe mbulojne kufirin poshte majtas te kartes
        '<div class="px-sj-veprime" role="group" aria-label="' + esc(t('sStatusi')) + '">' + st('saved', s.statusi === 'saved' ? t('stSaved') : t('bSave'), '☆') + st('replied', t('bReplied'), '✓') + st('rejected', s.statusi === 'rejected' ? t('stRejected') : t('bReject'), '✕') + aiBtn + '</div>' +
        '</article>';
    };
    if (this._sj.gjendja !== 'gati') return '';
    if (!SINJALE.length) return '<div class="px-bosh">' + esc(t('sAsnjeFort')) + '</div>';
    if (!lista.length) return '<p class="px-numri-sinjaleve">' + esc(t('sShfaqen').replace('{n}', 0)) + '</p><div class="px-bosh">' + esc(t('sAsnje')) + '</div>';
    void burimet; void gj;
    // Prova falas: shfaqen te gjitha rezultatet me 40+ (nga me te mirat te me te dobetat); numri ndryshon sipas filtrave
    var limit = sj.aiLimit ? '<div class="px-paralajmero" role="alert"><p><b>' + esc(t('aiLimitTitulli')) + '</b></p><ol class="px-kushtet"><li>' + esc(t('pFundi1')) + '</li><li>' + esc(t('pFundi2')) + '</li><li>' + esc(t('pFundi3')) + '</li></ol>' +
      '<button class="px-hyrje" data-e="hyr-sinjale2">' + SVG_HYRJE + '<span>' + esc(t('eHyr')) + '</span>' + SVG_DJATHTAS + '</button></div>' : '';
    return limit + '<p class="px-numri-sinjaleve">' + esc(lista.length === 1 ? t('sShfaqen1') : t('sShfaqen').replace('{n}', lista.length)) + '</p>' +
      '<div class="px-lista">' + lista.map(karta).join('') + '</div>';
  };

  // Zona e rezultateve te sinjaleve: gjendja e kerkimit, konfirmimi B2B/B2C, numrat, filtrat dhe lista.
  PxSinjaleEmail.prototype._htmlSinjaleZona = function () {
    var t = this._t.bind(this), self = this, sj = this._sj;
    var hyrje = '<button class="px-hyrje" data-e="hyr-sinjale2">' + SVG_HYRJE + '<span>' + esc(t('eHyr')) + '</span>' + SVG_DJATHTAS + '</button>';
    if (sj.gjendja === 'analiza' || sj.gjendja === 'kerkim' || sj.gjendja === 'vleresim' || sj.gjendja === 'nis')
      return '<p class="px-studio-stat" role="status"><span class="px-rrotull" aria-hidden="true"></span> ' + esc(sj.hapi || t('sDukeFilluar')) + '</p><p class="px-studio-stat">' + esc(t('sKohaPritjes')) + '</p>';
    if (sj.gjendja === 'konfirmo') {
      var b2b = sj.lloji !== 'b2c';
      return '<div class="px-paralajmero" role="alert"><p>' + esc(t(b2b ? 'sKonfirmoB2B' : 'sKonfirmoB2C')) + '</p>' +
        '<button class="px-buton" data-konfirmo="' + (b2b ? 'b2b' : 'b2c') + '">' + esc(t('sPo')) + '</button>' +
        '<button class="px-buton px-buton-dyte" data-konfirmo="' + (b2b ? 'b2c' : 'b2b') + '">' + esc(t(b2b ? 'sJoIndivide' : 'sJoBiznese')) + '</button></div>';
    }
    if (sj.gjendja === 'perdorur') return '<div class="px-paralajmero" role="alert"><p>' + esc(t('sPerdorur')) + '</p>' + hyrje + '</div>';
    if (sj.gjendja === 'gabim') return '<p class="px-studio-stat px-keq px-gabim-i-forte" role="alert">' + esc(sj.gabim || 'Error') + '</p>';
    if (sj.gjendja !== 'gati') return '<div class="px-bosh">' + esc(t('sSeShpejti')) + '</div>';
    var burimet = Array.from(new Set(SINJALE.map(function (s) { return s.burimi; })));
    var teMira = SINJALE.filter(function (s) { return s.pike >= 80; }).length;
    return '<div class="px-info"><strong>' + esc(t('sRezultatetPer')) + ' ' + esc(sj.domaini) + '</strong>' +
      '<span class="px-lloji"><b>' + (sj.lloji === 'b2c' ? 'B2C' : 'B2B') + '</b> · ' + esc(t('sLloji')) + '</span></div>' +
      '<div class="px-stat"><div><b>' + (sj.numri || 0) + '</b><span>' + esc(t('sStatGjetur')) + '</span></div>' +
      '<div><b>' + teMira + '</b><span>' + esc(t('sStatTeMira')) + '</span></div>' +
      '<div><b>' + burimet.length + '</b><span>' + esc(t('sStatBurime')) + '</span></div></div>' +
      (SINJALE.length ? '<div class="px-piket-shpjegim"><b>' + esc(t('sPiketTitulli')) + '</b> ' + esc(t('sPiketNen')) +
      '<ul><li><span class="px-pike px-pike-larte">80–100</span> ' + esc(t('sPiket80')) + '</li>' +
      '<li><span class="px-pike px-pike-mesme">60–79</span> ' + esc(t('sPiket60')) + '</li>' +
      '<li><span class="px-pike px-pike-ulet">40–59</span> ' + esc(t('sPiket40')) + '</li></ul>' + esc(t('sPiketFsheh')) + '</div>' : '') +
      (SINJALE.length ? '<div class="px-filtrat" role="group" aria-label="' + esc(t('sFiltri')) + '">' +
      '<div><label class="px-etiketa">' + esc(t('sBurimi')) + '</label><select class="px-select" data-filtri="burimi"><option value="">' + esc(t('sTeGjitha')) + '</option>' +
      burimet.map(function (b) { return '<option' + (self._filtri.burimi === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="px-etiketa">' + esc(t('sPikeMin')) + '</label><select class="px-select" data-filtri="min">' +
      [[40, t('sCdoPike')], [60, '60+'], [80, '80+']].map(function (o) { return '<option value="' + o[0] + '"' + (self._filtri.min === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="px-etiketa">' + esc(t('sStatusi')) + '</label><select class="px-select" data-filtri="statusi">' +
      [['all', t('stAll')], ['new', t('stNew')], ['saved', t('stSaved')], ['replied', t('stReplied')], ['rejected', t('stRejected')]].map(function (o) {
        var n = o[0] === 'all' ? SINJALE.length : SINJALE.filter(function (x) { return x.statusi === o[0]; }).length;
        return '<option value="' + o[0] + '"' + (self._filtri.statusi === o[0] ? ' selected' : '') + '>' + esc(o[1]) + ' (' + n + ')</option>';
      }).join('') + '</select></div>' +
      '</div>' : '') +
      '<div data-vendi="sinjalet">' + this._htmlSinjalet() + '</div>' +
      (!SINJALE.length ? hyrje : '');
  };
  // Statusi: klikimi i statusit aktiv e kthen sinjalin te "New"
  PxSinjaleEmail.prototype._statusiSinjalit = function (url, statusi) {
    var self = this, x = SINJALE.filter(function (s) { return s.url === url; })[0]; if (!x) return;
    var iri = x.statusi === statusi ? 'new' : statusi, vjeter = x.statusi;
    x.statusi = iri; this._rivizatoSinjalet();
    fetch(this._api() + '/sinjale/statusi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seanca: pxseSeanca(), domaini: this._sj.domaini, url: url, statusi: iri }) })
      .then(function (r) { if (!r.ok) throw new Error('x'); })
      .catch(function () { x.statusi = vjeter; self._rivizatoSinjalet(); });
  };
  // Pergjigje me AI (3 falas ne prove; pastaj kerkohet hyrja dhe hapat e regjistrimit)
  PxSinjaleEmail.prototype._pergjigjeAI = function (url) {
    var self = this, sj = this._sj, x = SINJALE.filter(function (s) { return s.url === url; })[0]; if (!x || sj.aiDuke) return;
    if (sj.aiMbetur <= 0) { sj.aiLimit = true; this._rivizatoSinjalet(); var p = this._rrenja.querySelector('[data-vendi="sinjalet"] .px-paralajmero'); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    sj.aiDuke = url; sj.aiGabim = null; this._rivizatoSinjalet();
    fetch(this._api() + '/sinjale/pergjigje', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seanca: pxseSeanca(), domaini: sj.domaini, url: url }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) {
        sj.aiDuke = '';
        if (o.ok && o.j.ok) { x.pergjigja = o.j.pergjigja; sj.aiMbetur = o.j.mbetur; }
        else if (o.j.limit) { sj.aiMbetur = 0; sj.aiLimit = true; }
        else sj.aiGabim = { url: url, teksti: o.j.error || 'Error' };
        self._rivizatoSinjalet();
      })
      .catch(function (e) { sj.aiDuke = ''; sj.aiGabim = { url: url, teksti: String(e && e.message || e) }; self._rivizatoSinjalet(); });
  };
  PxSinjaleEmail.prototype._kopjoPergjigjen = function (btn, karta) {
    // kopjohet teksti ashtu sic eshte tani ne fushe (i ndryshuar nga klienti ose jo)
    var t = this._t.bind(this), f = karta.querySelector('.px-ai-tekst'), tekst = f ? f.value : '';
    var u = function () { btn.textContent = t('aiKopjuar'); btn.classList.add('px-kopjuar'); setTimeout(function () { btn.textContent = t('aiKopjo'); btn.classList.remove('px-kopjuar'); }, 1800); };
    var rezerve = function () { var a = document.createElement('textarea'); a.value = tekst; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); u(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tekst).then(u, rezerve); else rezerve();
  };
  PxSinjaleEmail.prototype._rivizatoSinjalet = function () {
    var z = this._rrenja.querySelector('[data-vendi="sinjale-zona"]'); if (!z) return;
    z.innerHTML = this._htmlSinjaleZona(); this._lidhSinjalet(); pxseLartesiaPergjigjeve(z);
  };
  // Fushat e pergjigjeve marrin lartesine e tekstit (pa shirit levizjeje brenda)
  function pxseLartesiaPergjigjeve(z) { z.querySelectorAll('[data-ai-tekst]').forEach(function (f) { f.style.height = 'auto'; f.style.height = (f.scrollHeight + 2) + 'px'; }); }
  PxSinjaleEmail.prototype._lidhSinjalet = function () {
    var self = this, r = this._rrenja;
    r.querySelectorAll('[data-vendi="sinjale-zona"] [data-filtri]').forEach(function (s) {
      s.addEventListener('change', function () {
        var k = s.getAttribute('data-filtri');
        self._filtri[k] = k === 'burimi' || k === 'statusi' ? s.value : Number(s.value);
        var l = r.querySelector('[data-vendi="sinjalet"]'); if (l) { l.innerHTML = self._htmlSinjalet(); pxseLartesiaPergjigjeve(l); }
      });
    });
    // analitika: klikimi i "Open post" (vetem numri dhe burimi)
    r.querySelectorAll('[data-vendi="sinjale-zona"]').forEach(function (z) {
      if (z._ndegjuesPostimi) return; z._ndegjuesPostimi = true;
      z.addEventListener('click', function (ev) {
        var c = function (sel) { return ev.target.closest && ev.target.closest(sel); };
        var karta = c('article.px-karta'); var url = karta && karta.getAttribute('data-url');
        if (c('[data-e="hyr-sinjale2"]')) {
          pxseNgjarje(self._api(), 'klik_hyr', 'sinjale');
          self.dispatchEvent(new CustomEvent('px-veprim', { detail: { veprimi: 'hyr', nga: 'sinjale', domaini: self._sj.domaini || '', seanca: pxseSeanca() }, bubbles: true, composed: true }));
          return;
        }
        if (c('[data-st]')) { ev.preventDefault(); self._statusiSinjalit(url, c('[data-st]').getAttribute('data-st')); return; }
        if (c('[data-ai]')) { ev.preventDefault(); self._pergjigjeAI(url); return; }
        if (c('[data-kopjo]')) { ev.preventDefault(); self._kopjoPergjigjen(c('[data-kopjo]'), karta); return; }
        var a = c('a.px-lidhje[data-burimi]');
        if (a) { pxseNgjarje(self._api(), 'klik_postim', 'sinjale', a.getAttribute('data-burimi')); return; }
        if (c('.px-ai-kuti')) return; // teksti i pergjigjes zgjidhet/kopjohet, nuk hap postimin
        // e gjithe karta e klikueshme: hap postimin ne skede te re
        if (karta && url && !(window.getSelection && String(window.getSelection()).length)) {
          pxseNgjarje(self._api(), 'klik_postim', 'sinjale', karta.getAttribute('data-b'));
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
      // Ndryshimet ne tekstin e pergjigjes: ruhen ne kujtese menjehere dhe ne server pas pak (qe te mbeten kur kthehet)
      z.addEventListener('input', function (ev) {
        var f = ev.target; if (!f.matches || !f.matches('[data-ai-tekst]')) return;
        var k = f.closest('article.px-karta'), url = k && k.getAttribute('data-url');
        var x = SINJALE.filter(function (s) { return s.url === url; })[0]; if (!x) return;
        x.pergjigja = f.value; f.style.height = 'auto'; f.style.height = (f.scrollHeight + 2) + 'px';
        clearTimeout(f._ora);
        f._ora = setTimeout(function () {
          fetch(self._api() + '/sinjale/pergjigje-ndrysho', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seanca: pxseSeanca(), domaini: self._sj.domaini, url: url, tekst: x.pergjigja }) }).catch(function () {});
        }, 700);
      });
      z.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter') return;
        var k = ev.target.matches && ev.target.matches('article.px-karta') ? ev.target : null;
        if (k && k.getAttribute('data-url')) { pxseNgjarje(self._api(), 'klik_postim', 'sinjale', k.getAttribute('data-b')); window.open(k.getAttribute('data-url'), '_blank', 'noopener,noreferrer'); }
      });
    });
    r.querySelectorAll('[data-vendi="sinjale-zona"] [data-konfirmo]').forEach(function (b) {
      b.addEventListener('click', function () { self._konfirmoLlojin(b.getAttribute('data-konfirmo')); });
    });
    // (butonat "Sign in" brenda zones trajtohen nga ndegjuesi i perbashket i zones me lart)
  };
  // Vendos gjendjen nga pergjigja e serverit dhe vazhdon te pyese derisa kerkimi te mbaroje.
  PxSinjaleEmail.prototype._gjendjaSinjaleve = function (ok, j) {
    var sj = this._sj, self = this;
    j = j || {};
    clearTimeout(this._sjOra);
    if (j.perdorur) { sj.gjendja = 'perdorur'; }
    else if (!ok || j.ok === false) { sj.gjendja = 'gabim'; sj.gabim = j.error || 'Error'; }
    else {
      sj.gjendja = j.gjendja === 'asnje' ? '' : j.gjendja; sj.hapi = j.hapi || ''; sj.gabim = j.error || ''; sj.lloji = j.lloji || sj.lloji;
      if (j.gjendja === 'gati') { sj.numri = j.numri || 0; sj.aiMbetur = j.pergjigjeMbetur == null ? 3 : j.pergjigjeMbetur; pxseSinjaleNgaServeri(j.rezultatet, j.statuset, j.pergjigjet); }
      if (['analiza', 'kerkim', 'vleresim'].indexOf(j.gjendja) >= 0) {
        this._sjOra = setTimeout(function () {
          if (!self.isConnected) return;
          fetch(self._api() + '/sinjale?seanca=' + pxseSeanca() + '&domaini=' + encodeURIComponent(sj.domaini))
            .then(function (r) { return r.json().then(function (x) { return { ok: r.ok, j: x }; }); })
            .then(function (x) { self._gjendjaSinjaleve(x.ok, x.j); })
            .catch(function () { self._gjendjaSinjaleve(true, { gjendja: sj.gjendja, hapi: sj.hapi }); });
        }, 2000);
      }
    }
    this._rivizatoSinjalet();
  };
  PxSinjaleEmail.prototype._kerkoSinjale = function (d) {
    var sj = this._sj, self = this;
    pxseNgjarje(this._api(), 'klik_sinjale', 'sinjale'); // analitika: klikimi i "✦ Try it free: find interest signals"

    sj.domaini = d; sj.gjendja = 'nis'; sj.hapi = ''; sj.gabim = ''; SINJALE.length = 0; this._rivizatoSinjalet();
    fetch(this._api() + '/sinjale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domaini: d, seanca: pxseSeanca() }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (x.j && x.j.domaini) sj.domaini = x.j.domaini; self._gjendjaSinjaleve(x.ok, x.j); })
      .catch(function (e) { self._gjendjaSinjaleve(false, { error: String(e && e.message || e) }); });
  };
  PxSinjaleEmail.prototype._konfirmoLlojin = function (lloji) {
    var sj = this._sj, self = this;
    sj.gjendja = 'kerkim'; sj.hapi = ''; this._rivizatoSinjalet();
    fetch(this._api() + '/sinjale/konfirmo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domaini: sj.domaini, seanca: pxseSeanca(), lloji: lloji }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { self._gjendjaSinjaleve(x.ok, x.j); })
      .catch(function (e) { self._gjendjaSinjaleve(false, { error: String(e && e.message || e) }); });
  };

  PxSinjaleEmail.prototype._vizato = function () {
    var t = this._t.bind(this), gj = this._gjuha(), self = this;

    this._rrenja.innerHTML =
      '<style>' + CSS + '</style>' +
      '<section class="px" data-gjendja="' + this._gjendja + '">' +
      // ---------- HEADER I PERBASHKET ----------
      '<header class="px-koka"><span>✓ ' + esc(t('kokaTeksti')) + '</span></header>' +
      '<div class="px-korniza">' +

      // ---------- PJESA E MAJTE: EMAIL-ET (permbajtja ndertohet te _htmlEmail) ----------
      '<div class="px-pjesa px-pjesa-majte px-pjesa-email" id="pjesaMajte">' +
      '<div class="px-brenda" data-vendi="email">' + this._htmlEmail() + '</div></div>' +

      // ---------- NDARESI ME SHIGJETA ----------
      '<div class="px-ndaresi">' +
      '<div class="px-shigjetat">' +
      '<button class="px-shigjeta" data-shigjeta="majtas" aria-label="' + esc(t('shigjetaMajtas')) + '" title="' + esc(t('shigjetaMajtas')) + '">' + SVG_MAJTAS + '</button>' +
      '<button class="px-shigjeta" data-shigjeta="djathtas" aria-label="' + esc(t('shigjetaDjathtas')) + '" title="' + esc(t('shigjetaDjathtas')) + '">' + SVG_DJATHTAS + '</button>' +
      '</div>' +
      '</div>' +

      // ---------- PJESA E DJATHTE: SINJALET ----------
      '<div class="px-pjesa px-pjesa-djathte px-pjesa-sinjale" id="pjesaDjathte">' +
      '<div class="px-brenda">' +
      '<span class="px-eyebrow">' + esc(t('sEyebrow')) + '</span>' +
      '<h2>' + esc(t('sTitulli')) + '</h2>' +
      '<p class="px-nen">' + esc(t('sNen')) + '</p>' +
      '<div class="px-b2b">' + esc(t('sPerKe')) + '</div>' +
      '<form class="px-rresht" data-forma="sinjale">' +
      '<input class="px-input px-vetem-gjere" name="domain" type="text" inputmode="url" autocomplete="off" placeholder="' + esc(t('sDomain')) + '" value="' + esc(this._domaini) + '" aria-label="' + esc(t('sDomain')) + '">' +
      '<button class="px-buton" type="submit">✦ ' + esc(t('sGjej')) + '</button>' +
      '</form>' +
      // Prova falas: nje kerkim i vetem (sinjale te pergjithshme, 5 muajt e fundit). Sinjalet e reja cdo dite vetem pas hyrjes.
      '<p class="px-studio-stat" style="margin:6px 0 10px">' + esc(t('sNjeKerkim')) + '</p>' +
      '<button class="px-hyrje" data-e="hyr-sinjale" style="margin-bottom:4px">' + SVG_HYRJE + '<span>' + esc(t('sHyr')) + '</span>' + SVG_DJATHTAS + '</button>' +
      '<div data-vendi="sinjale-zona">' + this._htmlSinjaleZona() + '</div>' +
      '</div></div>' +

      '</div>' +
      '<div class="px-toast" role="status" aria-live="polite"></div>' +
      '</section>';

    this._lidhNgjarjet();
    this._apliko();
    this._lartesia();
  };

  // Lartesia: seksioni zen vetem pjesen e ekranit qe shihet kur hapet (nuk zgjatet poshte faqes).
  // Permbajtja qe nuk nxe leviz brenda secilës pjese.
  PxSinjaleEmail.prototype._lartesia = function () {
    var px = this._rrenja && this._rrenja.querySelector('.px'); if (!px) return;
    var rect = this.getBoundingClientRect(); if (!rect.width) return;
    var lart = rect.top + window.scrollY, vh = window.innerHeight;
    var h = lart < vh * 0.6 ? vh - lart - 24 : vh - 48;
    // 1.8 = lartesia e ekranit te dukshem + 80% me shume (kerkese e perdoruesit, sepse ishte shume e ulet)
    px.style.setProperty('--px-lartesia', Math.round(Math.max(460, h) * 1.8) + 'px');
  };

  // ---------- SEKSIONI I EMAIL-EVE ----------
  function dtLokale(d) {
    var z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes());
  }
  var KATER_ORE = 4 * 3600 * 1000;

  // Kontrollon rregullin falas: email-et te pakten 4 ore larg njeri-tjetrit. Kthen id-te qe e shkelin.
  PxSinjaleEmail.prototype._shkeljet = function () {
    var em = this._em;
    var l = em.zgjedhur.map(function (id) { return { id: id, t: Date.parse(em.oret[id] || '') }; });
    var keq = {};
    l.forEach(function (a) { if (isNaN(a.t)) keq[a.id] = true; });
    // edhe email-et qe jane planifikuar me pare per kete domain numerohen (rregulli 4 ore vlen per te gjitha)
    var ok = l.filter(function (a) { return !isNaN(a.t); }).concat((em.dergimet || []).map(function (x) { return { id: null, t: Date.parse(x.ora) }; }))
      .sort(function (a, b) { return a.t - b.t; });
    for (var i = 1; i < ok.length; i++) { if (ok[i].t - ok[i - 1].t < KATER_ORE) { if (ok[i].id) keq[ok[i].id] = true; if (ok[i - 1].id) keq[ok[i - 1].id] = true; } }
    return keq;
  };

  // ---------- DIREKTORIA DHE DERGIMET (nga serveri) ----------
  PxSinjaleEmail.prototype._api = function () { return (this.getAttribute('api') || '/api/pxse').replace(/\/$/, ''); };
  PxSinjaleEmail.prototype._ngarkoKategorite = function () {
    var self = this;
    fetch(this._api() + '/kategorite').then(function (r) { return r.json(); }).then(function (j) {
      KATEGORITE.length = 0;
      (j.kategorite || []).forEach(function (k) { KATEGORITE.push({ v: k.v, en: k.emri, sq: k.emri, n: k.n }); });
      self._ngarkoBizneset();
    }).catch(function () {});
  };
  PxSinjaleEmail.prototype._ngarkoBizneset = function () {
    var self = this, em = this._em, nr = (this._bizNr = (this._bizNr || 0) + 1);
    var url = this._api() + '/bizneset?kategoria=' + encodeURIComponent(this._kategoria || '') + '&domaini=' + encodeURIComponent(em.studim === 'gati' ? em.domaini : '');
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (nr !== self._bizNr) return; // nje kerkese me e re ka ardhur ndermjet
      BIZNESET.length = 0;
      (j.bizneset || []).forEach(function (b) { BIZNESET.push(b); });
      self._rivizatoEmail();
    }).catch(function () {});
  };
  // Biznesi i zgjedhur gjendet edhe kur lista ka ndryshuar (p.sh. pas ndryshimit te kategorise).
  PxSinjaleEmail.prototype._biz = function (id) {
    return BIZNESET.find(function (x) { return x.id === id; }) || this._em.bizCache[id] || null;
  };
  // Dita sipas ores se Berlinit (serveri e numeron kapacitetin ditor ne kete zone)
  function pxseDitaBerlin(t) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t)); }
    catch (e) { return new Date(t).toISOString().slice(0, 10); }
  }
  PxSinjaleEmail.prototype._ngarkoDitet = function () {
    var self = this;
    fetch(this._api() + '/ditet').then(function (r) { return r.json(); }).then(function (j) {
      self._em.ditet = (j && j.ditet) || []; self._rivizatoEmail();
    }).catch(function () {});
  };
  PxSinjaleEmail.prototype._liraNeDite = function (dita) {
    var x = (this._em.ditet || []).filter(function (d) { return d.dita === dita; })[0];
    return x ? x.lira : null; // null = nuk dihet (p.sh. pa lidhje): serveri vendos
  };
  // Id-te e marresve te zgjedhur qe bien ne nje dite plot (duke numeruar edhe zgjedhjet e tjera te se njejtes dite)
  PxSinjaleEmail.prototype._ditetPlot = function () {
    var em = this._em, self = this, numri = {}, keq = {};
    em.zgjedhur.forEach(function (id) {
      var t0 = Date.parse(em.oret[id] || ''); if (isNaN(t0)) return;
      var d = pxseDitaBerlin(t0); numri[d] = (numri[d] || 0) + 1;
      var lira = self._liraNeDite(d);
      if ((lira !== null && numri[d] > lira) || t0 > Date.now() + 7 * 86400000) keq[id] = true;
    });
    return keq;
  };
  PxSinjaleEmail.prototype._kufiriZgjedhjes = function () { var m = this._em.mbetur; return m == null ? 3 : Math.max(0, Math.min(3, m)); };
  PxSinjaleEmail.prototype._ngarkoDergimet = function () {
    var self = this, em = this._em;
    if (em.studim !== 'gati' || !em.domaini) return;
    fetch(this._api() + '/dergimet?seanca=' + pxseSeanca() + '&domaini=' + encodeURIComponent(em.domaini))
      .then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.ok) return;
        em.dergimet = j.dergimet || []; em.mbetur = j.mbetur;
        // Kur klienti kthehet: shfaqet email-i qe dergoi (subjekti, mesazhi, emri dhe dizajni)
        if (em.rikthim && j.email) {
          em.subjekti = j.email.subjekti || em.subjekti; em.trupi = j.email.trupi || em.trupi; em.marka = j.email.marka || em.marka;
          if (j.email.dizajn) em.dizajn = Object.assign({}, em.dizajn, j.email.dizajn);
        }
        self._rivizatoEmail();
      }).catch(function () {});
    // Statusi rifreskohet cdo minute (derguar, hapur, klikuar, cregjistruar)
    clearInterval(this._dergimetOra);
    this._dergimetOra = setInterval(function () {
      if (!self.isConnected) { clearInterval(self._dergimetOra); return; }
      if (!em.dergimet.length) return;
      fetch(self._api() + '/dergimet?seanca=' + pxseSeanca() + '&domaini=' + encodeURIComponent(em.domaini))
        .then(function (r) { return r.json(); }).then(function (j) {
          if (!j || !j.ok || JSON.stringify(j.dergimet) === JSON.stringify(em.dergimet)) return;
          em.dergimet = j.dergimet || []; em.mbetur = j.mbetur; self._rivizatoEmail();
        }).catch(function () {});
    }, 60000);
  };
  PxSinjaleEmail.prototype._htmlDergimet = function () {
    var t = this._t.bind(this), em = this._em;
    if (!em.dergimet.length) return '';
    var ora = function (x) { try { return new Date(x).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return String(x); } };
    var st = function (s, d) { return s === 'derguar' ? t('stDerguar') : (s === 'deshtoi' ? t('stDeshtoi') : (d && d.vonuar ? t('stVonuar') : t('stNeRadhe'))); };
    var po = function (b) { return b ? '<span class="px-po">✓</span>' : '<span class="px-jo">—</span>'; };
    return '<div class="px-hapi" style="margin-bottom:12px"><div class="px-hapi-koka"><span class="px-nr">4</span><h3>' + esc(t('eEmailetE')) + '</h3></div>' +
      '<div class="px-tabela-mbajtese"><table class="px-tabela"><thead><tr><th>' + esc(t('eKolMarresi')) + '</th><th>' + esc(t('eKolOra')) + '</th><th>' + esc(t('eKolStatusi')) + '</th><th>' +
      esc(t('eKolHapur')) + '</th><th>' + esc(t('eKolKlikuar')) + '</th><th>' + esc(t('eKolCregj')) + '</th></tr></thead><tbody>' +
      em.dergimet.map(function (d) {
        return '<tr><td><b>' + esc(d.marresi) + '</b><small>' + esc(d.domaini) + '</small></td><td>' + esc(ora(d.derguar_at || d.ora)) + '</td>' +
          '<td><span class="px-st px-st-' + esc(d.vonuar && d.statusi === 'ne_radhe' ? 'vonuar' : d.statusi) + '">' + esc(st(d.statusi, d)) + '</span></td><td>' + po(d.hapur) + '</td><td>' + po(d.klikuar) + '</td><td>' + po(d.cregj) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="px-studio-stat" style="margin:8px 0 0">' + esc(t('eShenimHapjet')) + '</p></div>';
  };

  PxSinjaleEmail.prototype._htmlEmail = function () {
    var t = this._t.bind(this), gj = this._gjuha(), em = this._em, self = this;
    var d = em.domaini || t('eDomaini');
    // Kusht: email-i vjen vetem nga domaini i studiuar me AI (nuk plotesohet me dore pa domain).
    // "mbyllur" = prova ka perfunduar (3 email-et u perdoren): email-i shfaqet vetem per lexim, pa marres dhe pa "Send".
    var mbyllur = em.studim === 'gati' && em.mbetur === 0;
    var gati = em.studim === 'gati' && !mbyllur;
    var emriKat = function (v) { var k = KATEGORITE.find(function (x) { return x.v === v; }); return k ? k[gj] : v; };

    // kategorite: te rekomanduarat (pas studimit me AI) dalin te parat
    var opsion = function (v, tekst) { return '<option value="' + esc(v) + '"' + (self._kategoria === v ? ' selected' : '') + '>' + esc(tekst) + '</option>'; };
    var kat = '<select class="px-select" style="width:100%" data-e="kategoria">';
    if (em.rekomanduar.length) {
      kat += '<optgroup label="' + esc(t('eRekomanduar').replace('{d}', d)) + '">' + em.rekomanduar.map(function (v) { return opsion(v, '★ ' + emriKat(v)); }).join('') + '</optgroup>';
    }
    kat += '<optgroup label="' + esc(t('eTeGjithaKat')) + '">' + opsion('', t('eTeGjithaKat')) +
      KATEGORITE.filter(function (k) { return em.rekomanduar.indexOf(k.v) < 0; }).map(function (k) { return opsion(k.v, k[gj]); }).join('') + '</optgroup></select>';

    var lista = BIZNESET.filter(function (b) { return !self._kategoria || b.kat === self._kategoria; })
      .sort(function (a, b) { return a.dite - b.dite; });
    var bizneset = !BIZNESET.length ? '<div class="px-shenim">' + esc(KATEGORITE.length ? t('eAsnjeNeKat') : t('eDirektoriaSeShpejti')) + '</div>' : '<div class="px-bizneset">' + lista.map(function (b) {
      var po = em.zgjedhur.indexOf(b.id) >= 0;
      return '<label class="px-biznes"><input type="checkbox" data-e="biznes" value="' + b.id + '"' + (po ? ' checked' : '') + '>' +
        '<span>' + esc(b.emri) + '<small>' + esc(b.domaini) + ' · ✓ email</small></span>' +
        '<em>' + esc(t('eShtuar').replace('{n}', b.dite)) + '</em></label>';
    }).join('') + '</div>';

    var keq = this._shkeljet(), plotZ = this._ditetPlot(), kaKeq = Object.keys(keq).length > 0 || Object.keys(plotZ).length > 0;
    var oraret = em.zgjedhur.length ? em.zgjedhur.map(function (id) {
      var b = self._biz(id) || { emri: id };
      return '<div class="px-orari' + (keq[id] || plotZ[id] ? ' px-gabim' : '') + '"><b>' + esc(b.emri) + '</b>' +
        '<input class="px-input" type="datetime-local" data-e="ora" data-id="' + id + '" min="' + esc(dtLokale(new Date())) + '" max="' + esc(dtLokale(new Date(Date.now() + 7 * 86400000))) + '" value="' + esc(em.oret[id] || '') + '">' +
        (plotZ[id] ? '<small class="px-keq" style="display:block;margin-top:4px">' + esc(Date.parse(em.oret[id]) > Date.now() + 7 * 86400000 ? t('eMaks7') : t('eDitaEZgjedhurPlot')) + '</small>' : '') + '</div>';
    }).join('') : '<div class="px-shenim" style="margin-top:0">' + esc(t('eOraretBosh')) + '</div>';

    var paralajmero = function (tekst) {
      return '<div class="px-paralajmero" role="alert"><p>' + esc(tekst) + '</p><button class="px-hyrje" data-e="hyr">' + SVG_HYRJE + '<span>' + esc(t('eHyr')) + '</span>' + SVG_DJATHTAS + '</button></div>';
    };
    // Ditet me vend te lire (kapaciteti ditor i email-eve tona, i perbashket per te gjitha provat)
    var sotD = pxseDitaBerlin(Date.now()), neserD = pxseDitaBerlin(Date.now() + 86400000);
    var ditet = !em.ditet.length ? '' : '<div class="px-etiketa" style="margin-top:4px">' + esc(t('eDitetLira')) + '</div><div class="px-ditet">' +
      em.ditet.map(function (x) {
        var emri = x.dita === sotD ? t('eSot') : (x.dita === neserD ? t('eNeser') : new Date(x.dita + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }));
        return '<span class="px-dita' + (x.lira ? '' : ' px-dita-plot') + '"><b>' + esc(emri) + '</b>' + esc(x.lira ? t('eDitaLira').replace('{n}', x.lira) : t('eDitaPlot')) + '</span>';
      }).join('') + '</div>';
    var plotSot = em.ditet.length && this._liraNeDite(sotD) === 0;
    var fundiHtml = '<div class="px-paralajmero" role="alert"><p><b>' + esc(t('pFundiTitulli')) + '</b></p><ol class="px-kushtet"><li>' + esc(t('pFundi1')) + '</li><li>' + esc(t('pFundi2')) + '</li><li>' + esc(t('pFundi3')) + '</li></ol>' +
      '<button class="px-hyrje" data-e="hyr">' + SVG_HYRJE + '<span>' + esc(t('eHyr')) + '</span>' + SVG_DJATHTAS + '</button></div>';
    var njoftim = '';
    if (mbyllur) njoftim = '';
    else if (em.njoftim === 'plot' || (gati && plotSot && !em.zgjedhur.length)) njoftim = paralajmero(t('ePlotSot'));
    else if (em.njoftim === 'limit') njoftim = paralajmero(t('eLimit3'));
    else if (em.njoftim === 'fundi') njoftim = fundiHtml;
    else if (kaKeq) njoftim = paralajmero(t('eKufiri4'));

    var stat = em.studim === 'duke' ? '<p class="px-studio-stat">' + esc(t('eDukeStudiuar').replace('{d}', d)) + '</p>' :
      (em.studim === 'gati' ? '<p class="px-studio-stat px-ok">✓ ' + esc(t('eStudiuar').replace('{d}', d)) + '</p>' :
      (em.studim === 'gabim' ? '<p class="px-studio-stat px-keq px-gabim-i-forte" role="alert">' + esc(em.gabimPlain ? em.gabim : t('eGabimStudim').replace('{e}', em.gabim || '')) + '</p>' :
      (em.studim === 'b2c' ? '<p class="px-studio-stat px-keq px-gabim-i-forte" role="alert">' + esc(t('eB2C').replace('{d}', d)) + '</p>' :
      (em.studim === 'perdorur' ? paralajmero(t('ePerdorur').replace('{d}', d)) : ''))));
    if (mbyllur) stat = paralajmero(t('eOfertaMbaroi').replace('{d}', d)) + (em.rikthim ? '<p class="px-studio-stat">' + esc(t('eRikthim').replace('{d}', d)) + '</p>' : '');
    else if (em.studim === 'gati' && em.rikthim && em.dergimet.length) stat = '<p class="px-studio-stat px-ok">✓ ' + esc(t('eRikthim').replace('{d}', d)) + '</p>';
    if (em.njoftim === 'fundi' && mbyllur) stat = fundiHtml + stat;

    return '<span class="px-eyebrow">' + esc(t('eEyebrow')) + '</span>' +
      '<h2>' + esc(t('eTitulli2')) + '</h2>' +
      '<p class="px-nen">' + esc(t('eNen2')) + '</p>' +
      '<div class="px-b2b">' + esc(t('eVetemB2B')) + ' <small>· ' + esc(t('eVetemB2BNen')) + '</small></div>' +
      // Permbledhja e email-eve te kesaj prove (numrat vijne nga serveri; tabela e plote eshte te hapi 4)
      '<div class="px-statistika px-vetem-gjere"><div><b>' + em.dergimet.filter(function (x) { return x.statusi === 'derguar'; }).length + '</b><span>' + esc(t('eDerguar')) + '</span></div>' +
      '<div><b>' + em.dergimet.filter(function (x) { return x.hapur; }).length + '</b><span>' + esc(t('eHapur')) + '</span></div>' +
      '<div><b>' + em.dergimet.filter(function (x) { return x.klikuar; }).length + '</b><span>' + esc(t('eKlikuar')) + '</span></div>' +
      '<div><b>' + em.dergimet.filter(function (x) { return x.cregj; }).length + '</b><span>' + esc(t('eCregjistruar')) + '</span></div></div>' +

      // Rreshti i siperm (vlen per mesazhin dhe per marresit):
      //  - versioni i ngushte: "Try it" + hyrja; kur klikohet "Try it", pjesa zgjerohet dhe del fusha e domainit
      //  - versioni i gjere: fusha e domainit me butonin "Study my business" ngjitur ne te djathte te saj;
      //    hyrja ne rresht me vete poshte, larg fushes (qe njerezit te mos klikojne hyrjen pasi shkruajne domainin)
      '<div class="px-veprimet-siper">' +
      '<button class="px-buton px-provo px-vetem-ngushte" data-e="provo">✦ ' + esc(t('eProvoAI')) + '</button>' +
      '<div class="px-studio px-studio-bashke px-vetem-gjere">' +
      '<input class="px-input" data-e="domaini" type="text" inputmode="url" autocomplete="off" placeholder="' + esc(t('eDomaini')) + '" value="' + esc(em.domaini) + '" aria-label="' + esc(t('eDomaini')) + '">' +
      '<button class="px-buton" data-e="studio"' + (em.studim === 'duke' ? ' disabled' : '') + '>✦ ' + esc(t('eStudio')) + '</button>' +
      '</div>' +
      '</div>' + stat +
      '<p class="px-studio-stat" style="margin:-4px 0 12px">' + esc(t('eNjeProve')) + '</p>' +
      '<div class="px-hyrje-rresht"><button class="px-hyrje" data-e="hyr">' + SVG_HYRJE + '<span>' + esc(t('eHyr')) + '</span>' + SVG_DJATHTAS + '</button></div>' +

      '<div class="px-email-rreshti">' +
      // 1. Mesazhi (me studimin e biznesit me AI ne versionin e gjere)
      '<div class="px-hapi"><div class="px-hapi-koka"><span class="px-nr">1</span><h3>' + esc(t('eMesazhi')) + '</h3></div>' +
      '<label class="px-etiketa">' + esc(t('eSubjekti')) + '</label>' +
      '<input class="px-input" style="width:100%" data-e="subjekti"' + (gati ? '' : ' readonly') + ' placeholder="' + esc(t('eSubjektiVlera')) + '" value="' + esc(gati || mbyllur ? em.subjekti : '') + '">' +
      '<div class="px-fushat">' + esc(t('eFusha')) + ' ' + ['{company}'].map(function (f) { return '<button class="px-fusha" data-fusha="' + f + '"' + (gati ? '' : ' disabled') + '>' + f + '</button>'; }).join('') + '</div>' +
      '<label class="px-etiketa">' + esc(t('eTrupi')) + '</label>' +
      '<textarea class="px-textarea" data-e="trupi"' + (gati ? '' : ' readonly') + ' placeholder="' + esc(t('eTrupiVlera')) + '">' + esc(gati || mbyllur ? em.trupi : '') + '</textarea>' +
      (gati || mbyllur ? '' : '<p class="px-studio-stat" style="margin:6px 0 0">' + esc(t('ePritDomainin')) + '</p>') +
      '</div>' +
      // Parapamja e drejtperdrejte: vetem ne versionin e gjere (ne 50/50 mbetet vetem "Your email")
      '<div class="px-hapi px-vetem-gjere" data-vendi="pamja">' + this._htmlPamja() + '</div>' +
      '</div>' +

      (mbyllur ? this._htmlDergimet() + '<div class="px-shenim">' + esc(t('eLigjore')) + '</div>' : (
      // 2. Marresit: kategoria (te rekomanduarat pas studimit) dhe bizneset me te reja; zgjidhen deri ne 3
      '<div class="px-hapi"><div class="px-hapi-koka"><span class="px-nr">2</span><h3>' + esc(t('eMarresit')) + '</h3></div>' +
      '<label class="px-etiketa">' + esc(t('eKategoria')) + '</label>' + kat +
      '<div class="px-shenim">✓ ' + esc(t('eVetemVerifikuar')) + '</div>' +
      '<div class="px-shenim">' + esc(t('eTeRejat')) + '</div>' +
      bizneset +
      '<div class="px-numerues">' + esc(t('eZgjedhur').replace('{n}', em.zgjedhur.length)) + '</div>' +
      (gati && em.mbetur != null ? '<div class="px-shenim">' + esc(t('eMbetur').replace('{n}', em.mbetur).replace('{d}', d)) + '</div>' : '') +
      '</div>' +
      '<div style="height:12px"></div>' +

      // 3. Planifikimi: nje ore per cdo email, te pakten 4 ore diference
      '<div class="px-hapi" style="margin-bottom:12px"><div class="px-hapi-koka"><span class="px-nr">3</span><h3>' + esc(t('eOraretTitulli')) + '</h3></div>' +
      '<p class="px-hapi-nen">' + esc(t('eRregulli')) + '</p>' +
      ditet + oraret +
      '</div>' +
      this._htmlDergimet() +

      // (Lidhja e email-it dergues behet vetem pas hyrjes ne llogari, ne panelin e perdoruesit.)
      njoftim +
      '<div class="px-veprimi"><button class="px-buton px-buton-dyte" data-e="preview"' + (gati ? '' : ' disabled') + '>' + esc(t('ePreview')) + '</button>' +
      '<button class="px-buton" data-e="dergo"' + (!gati || !em.zgjedhur.length || kaKeq || em.dergimi === 'duke' || em.mbetur === 0 ? ' disabled' : '') + '>' + esc(em.dergimi === 'duke' ? t('eDukeDerguar') : t('eDergo')) + '</button>' +
      '<span class="px-falas">✓ ' + esc(t('eFalas')) + '</span></div>' +
      (em.dergimi === 'ok' ? '<p class="px-studio-stat px-ok">✓ ' + esc(t('eUPlanifikua')) + '</p>' : '') +
      (em.gabimDergimi ? '<p class="px-studio-stat px-keq" role="alert">' + esc(t('eGabimDergimi').replace('{e}', em.gabimDergimi)) + '</p>' : '') +
      '<div class="px-shenim">' + esc(t('eLigjore')) + '</div>'));
  };

  // ---------- PARAPAMJA E DREJTPERDREJTE (djathtas "Your email", vetem ne versionin e gjere) ----------
  PxSinjaleEmail.prototype._marka = function () { return String(this._em.marka || '').trim() || emerMarke(this._em.domaini); };
  PxSinjaleEmail.prototype._marresiPamjes = function () {
    var em = this._em, t = this._t.bind(this);
    var self = this, b = em.zgjedhur.map(function (id) { return self._biz(id); }).filter(Boolean)[0];
    return b || { emri: t('eMarresShembull'), domaini: 'example.com', shembull: true };
  };
  PxSinjaleEmail.prototype._htmlPamjaEmail = function () {
    var t = this._t.bind(this), em = this._em;
    if (em.studim !== 'gati') return '<div class="px-shenim" style="margin-top:0">' + esc(t('pPritStudimin')) + '</div>';
    var b = this._marresiPamjes(), marka = this._marka();
    var subjekti = zevendeso(em.subjekti, b), trupi = zevendeso(em.trupi, b).replace(/\s+/g, ' ').trim();
    var ngj = pxseNgjyra(em.dizajn.ngjyra);
    var html = pxseNdertoEmailin({ subjekti: em.subjekti, trupi: em.trupi, marres: b, marka: marka, domaini: em.domaini, dizajn: em.dizajn, t: t });
    return '<div class="px-etiketa-vogel">' + esc(t('pInbox')) + (b.shembull ? ' <span class="px-shembull">' + esc(t('eShembullMarres')) + '</span>' : '') + '</div>' +
      '<div class="px-inbox"><span class="px-inbox-avatar" style="background:' + ngj + '">' + esc(marka.charAt(0)) + '</span>' +
      '<span class="px-inbox-teksti"><b>' + esc(marka) + '</b>&nbsp;&nbsp;<b>' + esc(subjekti) + '</b> <span>— ' + esc(trupi.slice(0, 140)) + '</span></span>' +
      '<span class="px-inbox-ora">' + esc(t('pTani')) + '</span></div>' +
      '<div class="px-etiketa-vogel">' + esc(t('pHapur')) + '</div>' +
      '<div class="px-hapur"><div class="px-hapur-koka"><div style="font-size:16px;font-weight:600;color:#202124;margin-bottom:4px">' + esc(subjekti) + '</div>' +
      '<b>' + esc(t('eNga')) + ':</b> ' + esc(marka) + '<br>' +
      '<b>' + esc(t('ePer')) + ':</b> ' + esc(b.emri) + '</div>' +
      '<div class="px-hapur-trupi">' + html + '</div></div>';
  };
  PxSinjaleEmail.prototype._htmlGaleria = function () {
    var t = this._t.bind(this), em = this._em, self = this, b = this._marresiPamjes(), marka = this._marka();
    return '<div class="px-galeria" role="radiogroup" aria-label="' + esc(t('pDizajnet')) + '">' + pxseDizajnetLista().map(function (dz) {
      var html = pxseNdertoEmailin({ subjekti: em.subjekti, trupi: em.trupi, marres: b, marka: marka, domaini: em.domaini, dizajn: Object.assign({}, em.dizajn, { id: dz.id }), t: t });
      var po = dz.id === em.dizajn.id;
      return '<button class="px-dz" role="radio" aria-checked="' + po + '" data-dizajni="' + esc(dz.id) + '" title="' + esc(t('pDizajnet')) + ' ' + esc(dz.id) + '">' +
        '<span class="px-dz-pamja" aria-hidden="true"><span class="px-dz-brenda">' + html + '</span></span><span class="px-dz-nr">' + esc(dz.id) + '</span></button>';
    }).join('') + '</div>';
  };
  PxSinjaleEmail.prototype._htmlPamja = function () {
    var t = this._t.bind(this), em = this._em, gati = em.studim === 'gati' && em.mbetur !== 0, d = em.dizajn;
    var koka = '<div class="px-pamja-koka"><div class="px-hapi-koka" style="margin:0"><h3>' + esc(t('pPamja')) + '</h3></div>' +
      (gati ? '<button class="px-redakto" data-e="redakto" aria-expanded="' + !!em.hapurDizajni + '">' +
        '<span class="px-redakto-ngj" style="background:' + esc(pxseNgjyra(d.ngjyra)) + '"></span>' + esc(t('pDizajnet')) + ' ' + esc(d.id) +
        ' · ' + esc(em.hapurDizajni ? t('pMbyllRedaktimin') : t('pRedakto')) + ' <span class="px-redakto-shigj" aria-hidden="true">' + (em.hapurDizajni ? '▴' : '▾') + '</span></button>' : '') + '</div>';
    var redaktori = !(gati && em.hapurDizajni) ? '' :
      '<div class="px-redaktori">' +
      '<div class="px-etiketa-vogel" style="margin-top:0">' + esc(t('pDizajnet')) + '</div>' + this._htmlGaleria() +
      '<div class="px-dizajn-kontrollet">' +
      '<div style="grid-column:1 / -1"><label class="px-etiketa">' + esc(t('pEmriDerguesit')) + '</label><input class="px-input" data-e="marka" maxlength="60" value="' + esc(this._marka()) + '"></div>' +
      '<div><label class="px-etiketa">' + esc(t('pNgjyra')) + '</label><input type="color" data-d="ngjyra" value="' + esc(pxseNgjyra(d.ngjyra)) + '"></div>' +
      '<div><label class="px-etiketa">' + esc(t('pLogo')) + '</label><input class="px-input" data-d="logo" type="url" placeholder="https://" value="' + esc(d.logo) + '"></div>' +
      '<div style="grid-column:1 / -1"><label class="px-kontroll" style="margin-top:0"><input type="checkbox" data-d="meButon"' + (d.meButon ? ' checked' : '') + '> ' + esc(t('pMeButon')) + '</label></div>' +
      (d.meButon ? '<div><label class="px-etiketa">' + esc(t('pButoniTekst')) + '</label><input class="px-input" data-d="butoniTekst" maxlength="40" value="' + esc(d.butoniTekst) + '"></div>' +
        '<div><label class="px-etiketa">' + esc(t('pButoniLink')) + '</label><input class="px-input" data-d="butoniLink" type="url" placeholder="https://' + esc(em.domaini || '') + '" value="' + esc(d.butoniLink) + '"></div>' : '') +
      '</div></div>';
    return koka + redaktori + '<div data-vendi="pamja-email">' + this._htmlPamjaEmail() + '</div>';
  };
  // Rifreskon vetem email-in ne parapamje (fushat ku shkruan klienti nuk preken, kursori mbetet aty).
  PxSinjaleEmail.prototype._rifreskoPamjen = function () {
    var v = this._rrenja.querySelector('[data-vendi="pamja-email"]'); if (!v) return;
    v.innerHTML = this._htmlPamjaEmail(); this._lidhPamjen();
    var g = this._rrenja.querySelector('.px-galeria');
    if (g) { clearTimeout(this._galeriaOra); var self = this; this._galeriaOra = setTimeout(function () { var g2 = self._rrenja.querySelector('.px-galeria'); if (g2) { g2.outerHTML = self._htmlGaleria(); self._lidhGalerine(); } }, 250); }
  };
  PxSinjaleEmail.prototype._lidhGalerine = function () {
    var self = this, em = this._em;
    this._rrenja.querySelectorAll('[data-vendi="pamja"] [data-dizajni]').forEach(function (b) {
      b.addEventListener('click', function () { em.dizajn.id = b.getAttribute('data-dizajni'); self._rivizatoEmail(); });
    });
  };
  PxSinjaleEmail.prototype._lidhPamjen = function () {
    var self = this, r = this._rrenja, em = this._em;
    r.querySelectorAll('[data-vendi="pamja-email"] a').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); }); });
    var st = r.querySelector('[data-vendi="pamja-email"] .px-hapur-trupi a[href="https://phronexusai.com/"]');
    if (st && st.parentNode) {
      st.parentNode.style.position = 'relative';
      var x = document.createElement('button');
      x.className = 'px-sticker-x'; x.type = 'button'; x.textContent = '✕';
      x.setAttribute('aria-label', this._t('pHiqStickerin')); x.title = this._t('pHiqStickerin');
      x.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        pxseNgjarje(self._api(), 'klik_x');
        em.njoftim = 'fundi'; self._rivizatoEmail();
        var p = self._rrenja.querySelector('.px-paralajmero'); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      st.parentNode.appendChild(x);
    }
  };

  // Rivizaton vetem seksionin e email-eve (pa humbur vendin ku ke levizur).
  PxSinjaleEmail.prototype._rivizatoEmail = function () {
    var b = this._rrenja.querySelector('[data-vendi="email"]'); if (!b) return;
    var sc = b.scrollTop; b.innerHTML = this._htmlEmail(); b.scrollTop = sc;
    this._lidhEmail(); this._lidhVeprimet();
  };

  // ---------- PARAPAMJA E EMAIL-IT (dizajn i lehte: duket si email i shkruar nga nje person) ----------
  // I njejti shabllon do perdoret edhe per dergimin e vertete: tekst i paster + nenshkrim + fundi me "reply no" dhe Unsubscribe.
  function emerMarke(domaini) {
    var e = String(domaini || '').split('.')[0] || '';
    return e ? e.charAt(0).toUpperCase() + e.slice(1) : 'Your company';
  }
  function zevendeso(tekst, b) {
    return String(tekst || '').replace(/\{company\}/g, b.emri);
  }
  function pxseHttps(u) { u = String(u || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  function pxseNgjyra(c) { return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toLowerCase() : '#3b6ef0'; }
  function pxseTekstMbiNgjyre(c) { // e bardhe mbi ngjyra te erreta, e zeze mbi te celeta
    var n = parseInt(pxseNgjyra(c).slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#141625' : '#ffffff';
  }
  // Ndertimi i email-it me dizajnin e zgjedhur nga lista e miratuar (window.pxseDizajnet, skedari pxse-dizajnet.js).
  // E njejta funksion dhe i njejti skedar dizajnesh perdoren per parapamjen dhe per dergimin: ajo qe sheh klienti eshte ajo qe dergohet.
  // o = { subjekti, trupi, marres:{emri}, marka, domaini, dizajn:{id,ngjyra,logo,meButon,butoniTekst,butoniLink}, t }
  function pxseDizajnetLista() { return (window.pxseDizajnet && window.pxseDizajnet.length) ? window.pxseDizajnet : []; }
  function pxseVleratEmailit(o) {
    var d = o.dizajn || {}, lidhja = o.domaini ? 'https://' + o.domaini : '';
    return {
      marka: o.marka, domaini: o.domaini || '', logo: pxseHttps(d.logo), ngjyra: pxseNgjyra(d.ngjyra),
      paragrafet: zevendeso(o.trupi, o.marres).split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean),
      butoni: d.meButon ? { tekst: String(d.butoniTekst || 'Visit our website').slice(0, 40), link: pxseHttps(d.butoniLink) || lidhja } : null,
      fundiJo: o.t('eFooterJo'), cregj: o.t('eCregjistrohu'),
      sticker: { rreshti1: o.t('fDergimMe'), rreshti2: o.t('fDergimMe2') }
    };
  }
  function pxseNdertoEmailin(o) {
    var lista = pxseDizajnetLista(), id = (o.dizajn && o.dizajn.id) || '2';
    var dz = lista.filter(function (x) { return x.id === id; })[0] || lista[0];
    var v = pxseVleratEmailit(o);
    if (dz) return dz.nderto(v);
    // (vetem nese pxse-dizajnet.js nuk u ngarkua) tekst i thjeshte
    return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#202124;">' +
      v.paragrafet.map(function (x) { return '<p style="margin:0 0 14px;">' + esc(x).replace(/\n/g, '<br>') + '</p>'; }).join('') +
      '<p><b>' + esc(v.marka) + '</b></p><p style="font-size:12px;color:#9aa4b2;">' + esc(v.fundiJo) + '</p></div>';
  }
  PxSinjaleEmail.prototype._hapParapamjen = function (nr) {
    var t = this._t.bind(this), em = this._em, self = this, r = this._rrenja;
    var marresit = em.zgjedhur.map(function (id) { return self._biz(id); }).filter(Boolean);
    var shembull = !marresit.length;
    if (shembull) {
      var lista = BIZNESET.filter(function (b) { return !self._kategoria || b.kat === self._kategoria; });
      marresit = [lista[0] || BIZNESET[0] || { emri: t('eMarresShembull'), domaini: 'example.com' }];
    }
    nr = Math.max(0, Math.min(nr || 0, marresit.length - 1));
    var b = marresit[nr], marka = this._marka();
    var subjekti = zevendeso(em.subjekti, b);
    var vjeter = r.querySelector('.px-modal'); if (vjeter) vjeter.remove();
    var m = document.createElement('div');
    m.className = 'px-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', t('eParapamje'));
    m.innerHTML =
      '<div class="px-modal-kuti">' +
      '<div class="px-modal-koka"><h3>' + esc(t('eParapamje')) + (shembull ? ' <span class="px-shembull">' + esc(t('eShembullMarres')) + '</span>' : '') + '</h3>' +
      '<div class="px-modal-veprime">' +
      (marresit.length > 1 ? '<button class="px-buton px-buton-dyte" data-p="para"' + (nr === 0 ? ' disabled' : '') + '>‹</button><span style="font-size:13px">' + (nr + 1) + ' / ' + marresit.length + '</span><button class="px-buton px-buton-dyte" data-p="pas"' + (nr === marresit.length - 1 ? ' disabled' : '') + '>›</button>' : '') +
      '<button class="px-buton px-buton-dyte" data-p="kompjuter" aria-pressed="' + !self._pvMobil + '">' + esc(t('eKompjuter')) + '</button>' +
      '<button class="px-buton px-buton-dyte" data-p="telefon" aria-pressed="' + !!self._pvMobil + '">' + esc(t('eTelefon')) + '</button>' +
      '<button class="px-buton" data-p="mbyll">' + esc(t('eMbyll')) + '</button>' +
      '</div></div>' +
      '<div class="px-modal-trup"><div class="px-postieri' + (self._pvMobil ? ' px-mobil' : '') + '">' +
      '<div class="px-postieri-koka"><div class="px-postieri-subjekti">' + esc(subjekti) + '</div>' +
      '<b>' + esc(t('eNga')) + ':</b> ' + esc(marka) + '<br>' +
      '<b>' + esc(t('ePer')) + ':</b> ' + esc(b.emri) + ' (' + esc(b.domaini) + ')</div>' +
      '<div class="px-postieri-mesazhi">' + pxseNdertoEmailin({ subjekti: em.subjekti, trupi: em.trupi, marres: b, marka: marka, domaini: em.domaini, dizajn: em.dizajn, t: t }).replace(/<a /g, '<a data-p="asgje" ') + '</div>' +
      '</div></div></div>';
    r.appendChild(m);
    var mbyll = function () { m.remove(); document.removeEventListener('keydown', esc_); var pb = r.querySelector('[data-e="preview"]'); if (pb) pb.focus(); };
    var esc_ = function (ev) { if (ev.key === 'Escape') mbyll(); };
    document.addEventListener('keydown', esc_);
    m.addEventListener('click', function (ev) {
      if (ev.target === m) { mbyll(); return; }
      var el = ev.target.closest('[data-p]'); if (!el) return;
      ev.preventDefault();
      var v = el.getAttribute('data-p');
      if (v === 'mbyll') mbyll();
      else if (v === 'para' || v === 'pas') { document.removeEventListener('keydown', esc_); self._hapParapamjen(nr + (v === 'pas' ? 1 : -1)); }
      else if (v === 'kompjuter' || v === 'telefon') { self._pvMobil = v === 'telefon'; document.removeEventListener('keydown', esc_); self._hapParapamjen(nr); }
    });
    var mb = m.querySelector('[data-p="mbyll"]'); if (mb) mb.focus();
  };

  PxSinjaleEmail.prototype._lidhEmail = function () {
    var self = this, r = this._rrenja, em = this._em;
    var q = function (s) { return r.querySelector('[data-vendi="email"] ' + s); };
    var qa = function (s) { return r.querySelectorAll('[data-vendi="email"] ' + s); };

    var provo = q('[data-e="provo"]');
    if (provo) provo.addEventListener('click', function () {
      if (!self._ePara) self._ePara = 'email';
      self._gjendja = 'majte'; self._apliko();
      setTimeout(function () { var i = q('[data-e="domaini"]'); if (i) i.focus(); }, 480);
    });

    var dom = q('[data-e="domaini"]');
    dom.addEventListener('input', function () { em.domaini = dom.value.trim(); });
    dom.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); q('[data-e="studio"]').click(); } });

    // Studimi i biznesit me AI: thirret motori (prototip.js: POST /api/px/email-ai). Adresa ndryshohet me atributin api="...".
    // Ne projektin real e thirr serveri i PhronexusAI si ndermjetes, me rregullin "nje prove per domain".
    q('[data-e="studio"]').addEventListener('click', function () {
      var d = String(dom.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '');
      if (!d) { dom.focus(); return; }
      pxseNgjarje(self._api(), 'klik_studio'); // analitika: klikimi i "Write my email with AI"
      if (!self._ePara) self._ePara = 'email';
      em.domaini = d; em.studim = 'duke'; em.gabim = ''; self._rivizatoEmail();
      var gj = self._gjuha();
      var api = (self.getAttribute('api') || '/api/pxse').replace(/\/$/, '');
      fetch(api + '/email-ai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domaini: d, seanca: pxseSeanca() }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (x.j && x.j.perdorur) { em.studim = 'perdorur'; self._rivizatoEmail(); return; }
          if (x.j && x.j.b2c) { em.studim = 'b2c'; self._rivizatoEmail(); return; } // vetem B2B
          // domain jo i vertete / jo biznes: mesazhi i serverit, me te kuqe, pa parashtese
          if (x.j && (x.j.jo_real || x.j.jo_biznes)) { em.studim = 'gabim'; em.gabim = x.j.error; em.gabimPlain = true; self._rivizatoEmail(); return; }
          if (!x.ok || !x.j.ok) { em.studim = 'gabim'; em.gabim = (x.j && x.j.error) || 'error'; em.gabimPlain = false; self._rivizatoEmail(); return; }
          var j = x.j;
          em.domaini = j.domaini || d; em.pershkrimi = j.pershkrimi; em.lloji = j.lloji; em.siguria = j.siguria;
          // B2C me siguri te larte: dergimi i email-eve nuk lejohet (vetem B2B)
          if (j.lloji === 'b2c' && j.siguria === 'high') { em.studim = 'b2c'; self._rivizatoEmail(); return; }
          em.subjekti = j.subjekti; em.trupi = j.trupi;
          if (/^#[0-9a-f]{6}$/i.test(j.ngjyra || '')) em.dizajn.ngjyra = j.ngjyra;
          if (pxseHttps(j.ikona)) em.dizajn.logo = j.ikona;
          em.marka = j.emri || em.marka; em.dizajn.meButon = true; em.dizajn.butoniTekst = j.butoniTekst || 'Visit our website'; em.dizajn.butoniLink = 'https://' + em.domaini;
          em.rekomanduar = (j.kategorite || []).slice(0, 2);
          if (em.rekomanduar.length) self._kategoria = em.rekomanduar[0];
          em.studim = 'gati'; em.dergimi = ''; em.gabimDergimi = ''; em.rikthim = !!j.rikthim; em.dergimet = []; em.mbetur = null;
          self._rivizatoEmail();
          self._ngarkoDitet();    // ditet me vend te lire
          self._ngarkoBizneset(); // bizneset e kategorise se rekomanduar, pa ato qe ky domain i ka kontaktuar
          self._ngarkoDergimet(); // email-et e meparshme te ketij domaini dhe sa falas kane mbetur
        })
        .catch(function (e) { em.studim = 'gabim'; em.gabim = String(e && e.message || e); self._rivizatoEmail(); });
      void gj;
    });

    var subj = q('[data-e="subjekti"]'), trupi = q('[data-e="trupi"]');
    // Fusha e mesazhit zgjatet sa i gjithe teksti (pa rreshtat e fshehur poshte)
    var rritFushen = function () { if (!trupi) return; trupi.style.height = 'auto'; trupi.style.height = Math.max(260, trupi.scrollHeight + 2) + 'px'; };
    rritFushen(); setTimeout(rritFushen, 0); setTimeout(rritFushen, 500);
    if (trupi) trupi.addEventListener('input', rritFushen);
    subj.addEventListener('input', function () { em.subjekti = subj.value; self._rifreskoPamjen(); });
    trupi.addEventListener('input', function () { em.trupi = trupi.value; self._rifreskoPamjen(); });

    // Parapamja: zgjedhja e dizajnit dhe personalizimi (ngjyra, logo, butoni)
    this._lidhGalerine();
    var red = q('[data-e="redakto"]');
    if (red) red.addEventListener('click', function () { em.hapurDizajni = !em.hapurDizajni; self._rivizatoEmail(); });
    var mk = q('[data-e="marka"]');
    if (mk) mk.addEventListener('input', function () { em.marka = mk.value; self._rifreskoPamjen(); });
    qa('[data-d]').forEach(function (inp) {
      var k = inp.getAttribute('data-d');
      inp.addEventListener(inp.type === 'checkbox' ? 'change' : 'input', function () {
        if (k === 'meButon') { em.dizajn.meButon = inp.checked; if (inp.checked && !em.dizajn.butoniTekst) em.dizajn.butoniTekst = 'Visit our website'; self._rivizatoEmail(); return; }
        em.dizajn[k] = inp.value; self._rifreskoPamjen();
      });
    });
    this._lidhPamjen();
    qa('[data-fusha]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-fusha');
        var a = trupi.selectionStart || trupi.value.length, z = trupi.selectionEnd || a;
        trupi.value = trupi.value.slice(0, a) + v + trupi.value.slice(z);
        em.trupi = trupi.value; self._rifreskoPamjen();
        trupi.focus(); trupi.selectionStart = trupi.selectionEnd = a + v.length;
      });
    });

    var kat = q('[data-e="kategoria"]');
    if (kat) kat.addEventListener('change', function () { self._kategoria = kat.value; self._rivizatoEmail(); self._ngarkoBizneset(); });

    // Zgjedhja e bizneseve: maksimumi 3 ne proven falas
    qa('[data-e="biznes"]').forEach(function (c) {
      c.addEventListener('change', function () {
        var id = c.value, i = em.zgjedhur.indexOf(id);
        em.njoftim = '';
        if (c.checked) {
          if (em.zgjedhur.length >= self._kufiriZgjedhjes()) { c.checked = false; em.njoftim = 'limit'; self._rivizatoEmail(); return; }
          em.zgjedhur.push(id);
          var bz = BIZNESET.find(function (x) { return x.id === id; }); if (bz) em.bizCache[id] = bz;
          if (!em.oret[id]) {
            // ora paresore: neser 09:00, pastaj +4 ore pas email-it te fundit
            var fundit = em.zgjedhur.slice(0, -1).map(function (x) { return Date.parse(em.oret[x] || ''); })
              .concat(em.dergimet.map(function (x) { return Date.parse(x.ora); })).filter(function (x) { return !isNaN(x) && x > Date.now(); });
            var dt;
            if (fundit.length) dt = new Date(Math.max.apply(null, fundit) + KATER_ORE);
            else { dt = new Date(); dt.setDate(dt.getDate() + 1); dt.setHours(9, 0, 0, 0); }
            // ditet plot anashkalohen (deri ne 7 dite perpara)
            for (var k = 0; k < 7 && self._liraNeDite(pxseDitaBerlin(dt.getTime())) === 0; k++) { dt.setDate(dt.getDate() + 1); dt.setHours(9, 0, 0, 0); }
            em.oret[id] = dtLokale(dt);
          }
        } else if (i >= 0) { em.zgjedhur.splice(i, 1); }
        self._rivizatoEmail();
      });
    });

    qa('[data-e="ora"]').forEach(function (inp) {
      inp.addEventListener('change', function () { em.oret[inp.getAttribute('data-id')] = inp.value; em.njoftim = ''; self._rivizatoEmail(); });
    });

    qa('[data-e="hyr"]').forEach(function (b) {
      b.addEventListener('click', function () {
        // Ne projektin real faqja e degjon kete ngjarje dhe hap regjistrimin / hyrjen.
        pxseNgjarje(self._api(), 'klik_hyr', 'email');
        self.dispatchEvent(new CustomEvent('px-veprim', { detail: { veprimi: 'hyr', nga: 'email', domaini: em.domaini || '', seanca: pxseSeanca() }, bubbles: true, composed: true }));
      });
    });

    var pv = q('[data-e="preview"]');
    if (pv) pv.addEventListener('click', function () { self._hapParapamjen(0); });

    // "Send": serveri i kontrollon perseri te gjitha rregullat, ndertoi email-in me te njejtin dizajn dhe e vendos ne radhe.
    var dergoB = q('[data-e="dergo"]');
    if (dergoB) dergoB.addEventListener('click', function () {
      if (em.dergimi === 'duke') return;
      var oret = em.zgjedhur.map(function (x) { var t0 = new Date(em.oret[x]); return isNaN(t0) ? '' : t0.toISOString(); }); // ora lokale -> ISO
      em.dergimi = 'duke'; em.gabimDergimi = ''; em.njoftim = ''; self._rivizatoEmail();
      fetch(self._api() + '/dergo', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seanca: pxseSeanca(), domaini: em.domaini, subjekti: em.subjekti, trupi: em.trupi, marka: self._marka(),
          dizajn: Object.assign({}, em.dizajn), marresit: em.zgjedhur.slice(), oret: oret }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          var j = x.j || {};
          if (x.ok && j.ok) {
            em.dergimi = 'ok'; em.dergimet = j.dergimet || []; em.mbetur = j.mbetur; em.zgjedhur = []; em.oret = {};
            self._rivizatoEmail(); self._ngarkoBizneset(); self._ngarkoDergimet(); self._ngarkoDitet(); return;
          }
          em.dergimi = '';
          if (j.plot) { em.ditet = j.ditet || em.ditet; em.njoftim = 'plot'; }
          else if (j.mbaroi) { em.mbetur = 0; }
          else if (j.limit) { if (j.mbetur != null) em.mbetur = j.mbetur; em.njoftim = 'limit'; }
          else em.gabimDergimi = j.error || 'error';
          self._rivizatoEmail();
        })
        .catch(function (e) { em.dergimi = ''; em.gabimDergimi = String(e && e.message || e); self._rivizatoEmail(); });
    });
  };

  // Vendos gjendjen e ndarjes: cilat pjese shihen, cilat shigjeta, dhe "inert" per pjesen e fshehur.
  PxSinjaleEmail.prototype._apliko = function () {
    var r = this._rrenja, g = this._gjendja;
    var px = r.querySelector('.px'); if (!px) return;
    px.setAttribute('data-gjendja', g);
    var majte = r.getElementById('pjesaMajte'), djathte = r.getElementById('pjesaDjathte');
    var btnD = r.querySelector('[data-shigjeta="djathtas"]'), btnM = r.querySelector('[data-shigjeta="majtas"]');
    btnD.hidden = g === 'majte';   // kur e majta eshte e plote, mbetet vetem "‹"
    btnM.hidden = g === 'djathte'; // kur e djathta eshte e plote, mbetet vetem "›"
    var fshih = function (el, po) { if (po) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); } else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); } };
    if (g === 'majte') majte.setAttribute('data-zgjeruar', ''); else majte.removeAttribute('data-zgjeruar');
    if (g === 'djathte') djathte.setAttribute('data-zgjeruar', ''); else djathte.removeAttribute('data-zgjeruar');
    // Nese klienti filloi me dergimin e email-eve, domaini qe dha atje plotesohet edhe te kerkimi i sinjaleve.
    // (Jo anasjelltas: nje biznes B2C mund te perdore sinjalet, por jo dergimin e email-eve.)
    if (g === 'djathte' && this._ePara === 'email' && this._em && this._em.domaini) {
      var inp = r.querySelector('[data-forma="sinjale"] input[name="domain"]');
      if (inp && !inp.value) inp.value = this._em.domaini;
    }
    fshih(majte, g === 'djathte');
    fshih(djathte, g === 'majte');
  };

  PxSinjaleEmail.prototype._toast = function (tekst) {
    var el = this._rrenja.querySelector('.px-toast');
    el.textContent = tekst; el.classList.add('px-shfaq');
    clearTimeout(this._toastOra);
    this._toastOra = setTimeout(function () { el.classList.remove('px-shfaq'); }, 2600);
  };

  PxSinjaleEmail.prototype._lidhNgjarjet = function () {
    var self = this, r = this._rrenja;

    // Shigjetat: "›" zgjeron te majten, "‹" zgjeron te djathten; pas zgjerimit kalohet nga njera te tjetra, pa u kthyer ne 50/50.
    r.querySelectorAll('[data-shigjeta]').forEach(function (b) {
      b.addEventListener('click', function () {
        self._gjendja = b.getAttribute('data-shigjeta') === 'djathtas' ? 'majte' : 'djathte';
        if (!self._ePara) self._ePara = self._gjendja === 'majte' ? 'email' : 'sinjale';
        self._apliko();
        var tjetri = r.querySelector('[data-shigjeta]:not([hidden])');
        if (tjetri) tjetri.focus();
      });
    });

    var forma = r.querySelector('[data-forma="sinjale"]');
    forma.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!self._ePara) self._ePara = 'sinjale';
      // Ne versionin e ngushte fusha e domainit eshte e fshehur: butoni e zgjeron pjesen dhe e shfaq fushen.
      if (self._gjendja !== 'djathte') {
        self._gjendja = 'djathte'; self._apliko();
        setTimeout(function () { forma.domain.focus(); }, 480);
        return;
      }
      var d = String(forma.domain.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '').replace(/^www\./, '');
      if (!d) { forma.domain.focus(); return; }
      self._domaini = d;
      if (['nis', 'analiza', 'kerkim', 'vleresim'].indexOf(self._sj.gjendja) >= 0 && self._sj.domaini === d) return; // kerkimi po vazhdon
      self._kerkoSinjale(d);
    });
    r.querySelector('[data-e="hyr-sinjale"]').addEventListener('click', function () {
      pxseNgjarje(self._api(), 'klik_hyr', 'sinjale');
      var dS = String((forma.domain && forma.domain.value) || self._em.domaini || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '');
      self.dispatchEvent(new CustomEvent('px-veprim', { detail: { veprimi: 'hyr', nga: 'sinjale', domaini: dS, seanca: pxseSeanca() }, bubbles: true, composed: true }));
    });

    this._lidhSinjalet();

    this._lidhEmail();
    this._lidhVeprimet();
  };

  PxSinjaleEmail.prototype._lidhVeprimet = function () {
    var self = this, r = this._rrenja;
    r.querySelectorAll('[data-veprim]').forEach(function (el) {
      if (el._lidhur) return; el._lidhur = true;
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        var v = el.getAttribute('data-veprim');
        if (v === 'planifiko' || v === 'hape') self._toast(self._t('eToast'));
        if (v === 'regjistrohu') { self.dispatchEvent(new CustomEvent('px-veprim', { detail: { veprimi: 'hyr', nga: 'sinjale', domaini: self._em.domaini || '', seanca: pxseSeanca() }, bubbles: true, composed: true })); return; }
        // Ngjarje per faqen qe e perdor komponentin (p.sh. hap dritaren e regjistrimit te projekti real).
        self.dispatchEvent(new CustomEvent('px-veprim', { detail: { veprimi: v }, bubbles: true, composed: true }));
      });
    });
  };

  window.customElements.define('px-sinjale-email', PxSinjaleEmail);
})();
