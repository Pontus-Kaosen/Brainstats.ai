import type { Language } from "@/lib/translations";
import { companyInfo, getSellerBlock } from "@/lib/companyInfo";
import type { LegalSlug } from "@/lib/legalSlugs";
export type { LegalSlug } from "@/lib/legalSlugs";
export { legalSlugs, isLegalSlug } from "@/lib/legalSlugs";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const contactEmail = "support@brainstats.ai";
const website = "brainstats.ai";

const documents: Record<
  Language,
  Record<LegalSlug, LegalDocument>
> = {
  sv: {
    terms: {
      title: "Användarvillkor",
      description:
        "Villkor för användning av BrainStats analysplattform och premiumtjänster.",
      lastUpdated: "12 juli 2026",
      sections: [
        {
          title: "1. Om BrainStats",
          paragraphs: [
            `BrainStats (${website}) är en AI-driven analysplattform för fotboll. Tjänsten tillhandahåller matchdata, statistik, riskbedömningar och AI-genererade insikter.`,
            "BrainStats är inte ett spelbolag. Vi tar inte emot spel, insatser, utbetalningar eller odds från användare. All information på plattformen är endast avsedd som beslutsstöd och analys.",
          ],
        },
        {
          title: "2. Tjänstens funktioner och planer",
          paragraphs: [
            "BrainStats är en helt digital webbtjänst. Nedan beskrivs huvudfunktionerna och vad som ingår i respektive plan.",
          ],
          bullets: [
            "Analyze – klistra in eller skicka en spelidé (text eller BrainSlip) och få AI-rapport med BrainScore™, risknivå, styrkor, risker, marknadsanalys och Brain Picks.",
            "Brain Builder – välj liga, match och marknad, bygg en BrainSlip och skicka till AI-analys.",
            "Dashboard – översikt över sparade analyser, planstatus, dagliga AI-kuponger och genvägar till Builder och Premium.",
            "Rapporter – sparade AI-analyser tillgängliga via unika länkar (/report/[id]).",
            "Daily Brain Picks – AI-genererade dagliga kuponger med olika riskprofiler och estimerade fair odds (inte liveodds från spelbolag).",
            "Premium-hantering – köp, uppgradering och avslut via Stripe Checkout och Stripe Customer Portal i dashboarden.",
            "Free – kostnadsfri plan med upp till 3 AI-analyser per dag, grundrapport, BrainScore™, 1 Brain Pick per analys och 1 daglig AI-kupong.",
            `Pro (${companyInfo.plans.pro.priceSv}) – obegränsade analyser, full Brain Builder, djupare rapporter, sparad historik, form/statistik, upp till 3 Brain Picks per analys och 3 dagliga AI-kuponger.`,
            `Elite (${companyInfo.plans.elite.priceSv}) – allt i Pro plus AI Match of the Day, Value Bets, prioriterad AI, upp till 5 Brain Picks per analys och 5 dagliga AI-kuponger.`,
          ],
        },
        {
          title: "3. Acceptans av villkor",
          paragraphs: [
            "Genom att skapa konto, logga in, använda webbplatsen eller köpa premium godkänner du dessa användarvillkor. Om du inte accepterar villkoren ska du inte använda tjänsten.",
          ],
        },
        {
          title: "4. Behörighet",
          paragraphs: [
            "Du måste vara minst 18 år för att använda BrainStats. Tjänsten riktar sig till vuxna som vill analysera fotboll och spelidéer på ett ansvarsfullt sätt.",
          ],
        },
        {
          title: "5. Konto och säkerhet",
          bullets: [
            "Du ansvarar för att uppgifterna i ditt konto är korrekta.",
            "Du får inte dela ditt konto med andra.",
            "Du ansvarar för att hålla ditt lösenord konfidentiellt.",
            "Meddela oss omgående om du misstänker obehörig åtkomst.",
          ],
        },
        {
          title: "6. Premium och betalning",
          paragraphs: [
            "Vissa funktioner kräver betald prenumeration (Pro eller Elite). Betalningar hanteras via Stripe. Detaljerade köpvillkor, priser, ångerrätt och reklamation finns i våra köpvillkor.",
            "Prenumerationer förnyas månadsvis tills de avslutas. Du kan hantera eller avsluta din prenumeration via Stripe Customer Portal i dashboarden.",
          ],
        },
        {
          title: "7. AI-analyser och ansvarsfriskrivning",
          bullets: [
            "AI-resultat är automatgenererade och kan innehålla fel eller ofullständig information.",
            "BrainStats garanterar inte vinst, resultat eller att en spelidé är korrekt.",
            "Analysen ersätter inte egen bedömning eller oberoende research.",
            "Du ansvarar själv för alla beslut du tar baserat på tjänsten.",
          ],
        },
        {
          title: "8. Tillåten användning",
          paragraphs: ["Du får inte:"],
          bullets: [
            "Missbruka, hacka eller störa plattformen.",
            "Automatiskt skrapa eller massladda API:er utan tillstånd.",
            "Sprida olagligt, vilseledande eller kränkande innehåll.",
            "Använda tjänsten på sätt som bryter mot lag eller tredje parts rättigheter.",
          ],
        },
        {
          title: "9. Immateriella rättigheter",
          paragraphs: [
            "BrainStats varumärke, design, kod och originalinnehåll tillhör BrainStats eller våra licensgivare. Du får inte kopiera, sälja vidare eller sprida tjänstens innehåll utan skriftligt tillstånd.",
          ],
        },
        {
          title: "10. Ansvarsbegränsning",
          paragraphs: [
            "BrainStats tillhandahålls i befintligt skick. I den utsträckning lagen tillåter ansvarar vi inte för indirekta skador, förlorad vinst, dataförlust eller beslut som fattas utifrån AI-analyser.",
            "Vårt totala ansvar gentemot dig är begränsat till det belopp du betalat för tjänsten under de senaste 12 månaderna.",
          ],
        },
        {
          title: "11. Uppsägning",
          paragraphs: [
            "Du kan när som helst avsluta ditt konto. Vi kan stänga av eller avsluta konton som bryter mot villkoren eller missbrukar tjänsten.",
          ],
        },
        {
          title: "12. Ändringar",
          paragraphs: [
            "Vi kan uppdatera dessa villkor. Väsentliga ändringar meddelas via webbplatsen. Fortsatt användning efter ändring innebär att du accepterar de uppdaterade villkoren.",
          ],
        },
        {
          title: "13. Tillämplig lag och tvist",
          paragraphs: [
            "Svensk lag tillämpas om inte tvingande konsumentregler i ditt land säger annat. Tvister ska i första hand lösas genom dialog. Konsumenter kan vända sig till Allmänna reklamationsnämnden (ARN) eller motsvarande instans.",
          ],
        },
        {
          title: "14. Kontakt",
          paragraphs: [
            `Frågor om villkoren: ${contactEmail}`,
          ],
        },
      ],
    },
    purchase: {
      title: "Köpvillkor",
      description:
        "Villkor för köp av digitala premium-prenumerationer på BrainStats (Pro och Elite).",
      lastUpdated: "12 juli 2026",
      sections: [
        {
          title: "1. Säljare",
          paragraphs: [getSellerBlock("sv"), companyInfo.vatNoteSv],
        },
        {
          title: "2. Vad som säljs",
          paragraphs: [
            "BrainStats säljer digitala prenumerationer till en AI-driven fotbollsanalysplattform. Tjänsten är helt digital – ingen fysisk vara levereras.",
            "Free-planen är kostnadsfri och omfattas inte av dessa köpvillkor. Köpvillkoren gäller endast betalda planer.",
          ],
          bullets: [
            `Pro – ${companyInfo.plans.pro.priceSv}: obegränsade AI-analyser, djupare rapporter, full Brain Builder, sparad historik, form och statistik, upp till 3 Brain Picks per analys och 3 dagliga AI-kuponger.`,
            `Elite – ${companyInfo.plans.elite.priceSv}: allt i Pro plus AI Match of the Day, Daily Brain Picks, Value Bets, prioriterad AI och tidig tillgång till nya funktioner, upp till 5 Brain Picks per analys och 5 dagliga AI-kuponger.`,
            "Free-planen (0 kr) omfattas inte av dessa köpvillkor men ger begränsad tillgång enligt användarvillkoren.",
          ],
        },
        {
          title: "3. Pris och betalning",
          bullets: [
            "Priset som visas på premium-sidan och i Stripe Checkout är det pris du betalar per månad.",
            "Betalning sker i förskott via Stripe (kort eller annan betalmetod som Stripe erbjuder).",
            "Prenumerationen förnyas automatiskt varje månad tills du säger upp den.",
            "Vi förbehåller oss rätten att ändra priser för framtida perioder. Prisändring meddelas i förväg och gäller från nästa faktureringsperiod.",
          ],
        },
        {
          title: "4. Leverans och tillgång",
          paragraphs: [
            "Premium-funktioner aktiveras digitalt direkt efter genomförd betalning. Du får tillgång via ditt BrainStats-konto på webbplatsen.",
            "Du ansvarar för att ha fungerande internet, webbläsare och inloggningsuppgifter.",
          ],
        },
        {
          title: "5. Avtalstid och uppsägning",
          bullets: [
            "Avtalet gäller tills du eller BrainStats avslutar prenumerationen.",
            "Du kan när som helst säga upp via Stripe Customer Portal (knappen Hantera abonnemang i dashboarden).",
            "Uppsägning stoppar framtida debiteringar. Du behåller premium till slutet av den redan betalda perioden om Stripe anger det.",
            "BrainStats kan stänga av premium vid brott mot villkor eller utebliven betalning.",
          ],
        },
        {
          title: "6. Ångerrätt (distansavtal)",
          paragraphs: [
            "Som konsument har du normalt 14 dagars ångerrätt enligt distansavtalslagen när du köper på internet.",
            "För digitala tjänster som levereras omedelbart gäller undantag: om du uttryckligen begär att tjänsten ska börja direkt och godkänner att ångerrätten upphör när leveransen har påbörjats, förlorar du ångerrätten när premium har aktiverats.",
            "Innan köp ombeds du bekräfta att du vill ha omedelbar tillgång och att du har tagit del av köpvillkoren.",
          ],
          bullets: [
            "Har du inte begärt omedelbar tillgång kan du ångra köpet inom 14 dagar genom att kontakta oss.",
            "Vid giltig ånger inom 14 dagar återbetalar vi beloppet inom 14 dagar från att vi mottagit meddelandet.",
            "Kontakt för ånger: " + contactEmail,
          ],
        },
        {
          title: "7. Reklamation och fel i tjänsten",
          paragraphs: [
            "Om premium inte fungerar som avtalat trots rimliga försök att lösa problemet, kontakta oss så utreder vi felet.",
            "Konsumenten kan enligt konsumenttjänstlagen reklamera inom skälig tid efter att felet upptäckts.",
            "Vi kan i första hand avhjälpa felet, ge prisavdrag eller i allvarliga fall häva avtalet enligt lag.",
          ],
        },
        {
          title: "8. Återbetalning",
          bullets: [
            "Utöver lagstadgad ångerrätt ges normalt ingen återbetalning för redan påbörjad och nyttjad abonnemangsperiod.",
            "Vid tekniskt fel som vi inte kan åtgärda inom skälig tid kan återbetalning eller kreditering ges efter bedömning.",
            "Chargebacks hanteras enligt Stripes regler och våra register över levererad tjänst.",
          ],
        },
        {
          title: "9. Personuppgifter",
          paragraphs: [
            "Personuppgifter behandlas enligt vår integritetspolicy. Betalningsuppgifter hanteras av Stripe och lagras inte fullständigt hos BrainStats.",
          ],
        },
        {
          title: "10. Tvistlösning",
          paragraphs: [
            "Kontakta oss först vid klagomål så försöker vi lösa ärendet.",
            "Konsumenter kan vända sig till Allmänna reklamationsnämnden (ARN), Box 174, 101 23 Stockholm, arn.se.",
            "EU-konsumenter kan även använda EU-kommissionens plattform för onlinetvistlösning (ODR).",
          ],
        },
        {
          title: "11. Kontakt",
          paragraphs: [
            `Köp, ånger och reklamation: ${contactEmail}`,
          ],
        },
      ],
    },
    privacy: {
      title: "Integritetspolicy",
      description:
        "Hur BrainStats samlar in, använder och skyddar personuppgifter enligt GDPR.",
      lastUpdated: "12 juli 2026",
      sections: [
        {
          title: "1. Personuppgiftsansvarig",
          paragraphs: [
            getSellerBlock("sv"),
            `BrainStats (${website}) är personuppgiftsansvarig för behandlingen av personuppgifter i samband med tjänsten.`,
            `Kontakt för integritetsfrågor: ${contactEmail}`,
          ],
        },
        {
          title: "2. Vilka uppgifter vi samlar in",
          bullets: [
            "Kontouppgifter: e-postadress och autentiseringsdata via Supabase.",
            "Prenumerationsdata: plan, betalstatus och Stripe-kund-ID.",
            "Användningsdata: analyser du skapar, dashboard-historik och dagliga AI-kuponger.",
            "Teknisk data: IP-adress, enhet, webbläsare och loggar för säkerhet och felsökning.",
            "Analysdata: matchval, marknader och text du skickar till AI-analys.",
            "Språkval sparas lokalt i webbläsaren (localStorage).",
          ],
        },
        {
          title: "3. Varför vi behandlar uppgifter",
          bullets: [
            "Tillhandahålla och förbättra tjänsten (avtal).",
            "Hantera inloggning, konto och premium (avtal).",
            "Betalning och fakturering via Stripe (avtal / rättslig förpliktelse).",
            "Säkerhet, felsökning och missbruksförebyggande (berättigat intresse).",
            "Anonymiserad/anonym statistik via Vercel Analytics (berättigat intresse / samtycke där krävs).",
          ],
        },
        {
          title: "4. AI och tredjepartsleverantörer",
          paragraphs: [
            "För att leverera tjänsten använder vi betrodda underleverantörer:",
            "Uppgifter kan behandlas utanför EU/EES om leverantören kräver det. Vi använder leverantörer med lämpliga skyddsåtgärder, t.ex. standardavtalsklausuler där det behövs.",
          ],
          bullets: [
            "Supabase – autentisering och databas.",
            "Stripe – betalningar och prenumerationer.",
            "OpenAI – AI-genererade analyser baserat på matchdata du begär.",
            "API-Football – match-, lag- och statistikdata.",
            "Vercel – hosting och anonym besöksstatistik.",
          ],
        },
        {
          title: "5. Lagringstid",
          bullets: [
            "Kontouppgifter sparas tills du raderar kontot eller begär radering.",
            "Analyshistorik sparas för att visa dashboard och rapporter.",
            "Betalningsuppgifter hanteras enligt Stripes policy och bokföringskrav.",
            "Tekniska loggar sparas normalt i begränsad tid.",
          ],
        },
        {
          title: "6. Dina rättigheter",
          bullets: [
            "Få tillgång till dina personuppgifter.",
            "Begära rättelse av felaktiga uppgifter.",
            "Begära radering (med förbehåll för lagkrav).",
            "Begära begränsning av behandling.",
            "Invända mot viss behandling baserad på berättigat intresse.",
            "Få ut data i maskinläsbart format (dataportabilitet).",
            "Klaga till Integritetsskyddsmyndigheten (IMY).",
          ],
          paragraphs: [
            `För att utöva dina rättigheter, kontakta ${contactEmail}.`,
          ],
        },
        {
          title: "7. Säkerhet",
          paragraphs: [
            "Vi använder tekniska och organisatoriska åtgärder för att skydda dina uppgifter, inklusive krypterad transport (HTTPS), åtkomstkontroll och begränsad åtkomst till produktionsdata.",
          ],
        },
        {
          title: "8. Barn",
          paragraphs: [
            "BrainStats riktar sig inte till personer under 18 år och samlar inte medvetet in uppgifter från barn.",
          ],
        },
        {
          title: "9. Ändringar",
          paragraphs: [
            "Vi kan uppdatera denna policy. Senaste version publiceras alltid på webbplatsen med uppdaterat datum.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookiepolicy",
      description:
        "Information om cookies, lokal lagring och liknande teknik på BrainStats.",
      lastUpdated: "12 juli 2026",
      sections: [
        {
          title: "1. Vad är cookies?",
          paragraphs: [
            "Cookies är små textfiler som lagras i webbläsaren. Vi använder även lokal lagring (localStorage) för vissa inställningar.",
          ],
        },
        {
          title: "2. Vad vi använder",
          bullets: [
            "Nödvändiga cookies/sessioner via Supabase för inloggning och säkerhet.",
            "Språkval (localStorage: brainstats-language) för att komma ihåg SV/EN.",
            "Cookie-samtycke (localStorage: brainstats-cookie-consent).",
            "Anonym besöksstatistik via Vercel Analytics för att förstå trafik och förbättra tjänsten.",
          ],
        },
        {
          title: "3. Samtycke",
          paragraphs: [
            "Nödvändiga funktioner krävs för att tjänsten ska fungera. Analys-cookies aktiveras först efter ditt samtycke via cookie-bannern, där så krävs enligt lag.",
          ],
        },
        {
          title: "4. Hantera cookies",
          paragraphs: [
            "Du kan blockera eller radera cookies i webbläsarens inställningar. Om du blockerar nödvändiga cookies kan inloggning och vissa funktioner sluta fungera.",
          ],
        },
        {
          title: "5. Kontakt",
          paragraphs: [
            `Frågor om cookies: ${contactEmail}`,
          ],
        },
      ],
    },
    disclaimer: {
      title: "Ansvarsfriskrivning",
      description:
        "Viktig information om AI-analyser, spelansvar och risker.",
      lastUpdated: "12 juli 2026",
      sections: [
        {
          title: "1. BrainStats är inte ett spelbolag",
          paragraphs: [
            "BrainStats erbjuder analys, statistik och AI-baserade insikter. Vi erbjuder inte spel, odds, insatsmottagning eller utbetalningar. Vi är inte en operatör enligt spellagen.",
          ],
        },
        {
          title: "2. Ingen garanti för resultat",
          paragraphs: [
            "Alla analyser, BrainScore, sannolikheter och AI-förslag är uppskattningar baserade på tillgänglig data. Fotboll innehåller hög varians. Tidigare resultat är ingen garanti för framtida utfall.",
          ],
        },
        {
          title: "3. Spela ansvarsfullt",
          bullets: [
            "Spela endast om du är 18+ och det är lagligt i ditt land.",
            "Spela aldrig för mer än du har råd att förlora.",
            "Ta pauser och sök hjälp om spelandet känns problematiskt.",
          ],
          paragraphs: [
            "Sverige: Stödlinjen för spelberoende – stodlinjen.se, telefon 020-81 91 00.",
            "Internationellt: besök BeGambleAware.org eller motsvarande hjälporganisation i ditt land.",
          ],
        },
        {
          title: "4. AI-begränsningar",
          paragraphs: [
            "AI kan hallucinera, missa skador, förseningar eller sena lagändringar. Kontrollera alltid viktig information nära matchstart. BrainStats ersätter inte professionell rådgivning.",
          ],
        },
        {
          title: "5. Fair odds och AI-kuponger",
          paragraphs: [
            "Estimerade fair odds som visas i analyser och Daily Brain Picks är AI-baserade jämförelsevärden – inte liveodds från spelbolag och inte ett erbjudande att spela.",
            "AI Match of the Day, Value Bets och Brain Picks är förslag och analyser, inte garantier eller rekommendationer att placera insatser hos tredje part.",
          ],
        },
        {
          title: "6. Externa länkar och data",
          paragraphs: [
            "Matchdata kommer från tredjepartsleverantörer och kan vara försenad eller felaktig. Vi ansvarar inte för fel i extern data.",
          ],
        },
        {
          title: "7. Kontakt",
          paragraphs: [
            `Frågor: ${contactEmail}`,
          ],
        },
      ],
    },
  },
  en: {
    terms: {
      title: "Terms of Service",
      description:
        "Terms for using the BrainStats analysis platform and premium services.",
      lastUpdated: "12 July 2026",
      sections: [
        {
          title: "1. About BrainStats",
          paragraphs: [
            `BrainStats (${website}) is an AI-powered football analysis platform. The service provides match data, statistics, risk assessments and AI-generated insights.`,
            "BrainStats is not a gambling operator. We do not accept bets, stakes, payouts or odds from users. All information is provided for analysis and decision support only.",
          ],
        },
        {
          title: "2. Service features and plans",
          paragraphs: [
            "BrainStats is a fully digital web service. Below are the main features and what each plan includes.",
          ],
          bullets: [
            "Analyze – paste or submit a bet idea (text or BrainSlip) and receive an AI report with BrainScore™, risk level, strengths, risks, market analysis and Brain Picks.",
            "Brain Builder – choose league, match and market, build a BrainSlip and send it for AI analysis.",
            "Dashboard – overview of saved analyses, plan status, daily AI slips and shortcuts to Builder and Premium.",
            "Reports – saved AI analyses available via unique links (/report/[id]).",
            "Daily Brain Picks – AI-generated daily slips with different risk profiles and estimated fair odds (not live bookmaker odds).",
            "Premium management – purchase, upgrade and cancel via Stripe Checkout and the Stripe Customer Portal in your dashboard.",
            "Free – free plan with up to 3 AI analyses per day, basic report, BrainScore™, 1 Brain Pick per analysis and 1 daily AI slip.",
            `Pro (${companyInfo.plans.pro.priceEn}) – unlimited analyses, full Brain Builder, deeper reports, saved history, form/statistics, up to 3 Brain Picks per analysis and 3 daily AI slips.`,
            `Elite (${companyInfo.plans.elite.priceEn}) – everything in Pro plus AI Match of the Day, Value Bets, priority AI, up to 5 Brain Picks per analysis and 5 daily AI slips.`,
          ],
        },
        {
          title: "3. Acceptance",
          paragraphs: [
            "By creating an account, signing in, using the website or purchasing premium, you agree to these Terms. If you do not agree, do not use the service.",
          ],
        },
        {
          title: "4. Eligibility",
          paragraphs: [
            "You must be at least 18 years old to use BrainStats. The service is intended for adults who want to analyse football and bet ideas responsibly.",
          ],
        },
        {
          title: "5. Account and security",
          bullets: [
            "You are responsible for keeping your account information accurate.",
            "Do not share your account with others.",
            "Keep your password confidential.",
            "Notify us immediately if you suspect unauthorised access.",
          ],
        },
        {
          title: "6. Premium and payments",
          paragraphs: [
            "Some features require a paid subscription (Pro or Elite). Payments are processed by Stripe. Detailed purchase terms, prices, withdrawal rights and complaints are in our Purchase Terms.",
            "Subscriptions renew monthly until cancelled. You can manage or cancel via the Stripe Customer Portal in your dashboard.",
          ],
        },
        {
          title: "7. AI analyses and disclaimer",
          bullets: [
            "AI outputs are automatically generated and may contain errors or incomplete information.",
            "BrainStats does not guarantee wins, outcomes or accuracy of any bet idea.",
            "Analysis does not replace your own judgement or independent research.",
            "You are solely responsible for decisions made using the service.",
          ],
        },
        {
          title: "8. Acceptable use",
          paragraphs: ["You must not:"],
          bullets: [
            "Abuse, hack or disrupt the platform.",
            "Scrape or bulk-load APIs without permission.",
            "Publish illegal, misleading or harmful content.",
            "Use the service in violation of law or third-party rights.",
          ],
        },
        {
          title: "9. Intellectual property",
          paragraphs: [
            "BrainStats branding, design, code and original content belong to BrainStats or our licensors. You may not copy, resell or redistribute the service without written permission.",
          ],
        },
        {
          title: "10. Limitation of liability",
          paragraphs: [
            "BrainStats is provided as is. To the extent permitted by law, we are not liable for indirect damages, lost profits, data loss or decisions based on AI analyses.",
            "Our total liability to you is limited to the amount you paid for the service in the last 12 months.",
          ],
        },
        {
          title: "11. Termination",
          paragraphs: [
            "You may close your account at any time. We may suspend or terminate accounts that breach these Terms or misuse the service.",
          ],
        },
        {
          title: "12. Changes",
          paragraphs: [
            "We may update these Terms. Material changes will be posted on the website. Continued use after changes means you accept the updated Terms.",
          ],
        },
        {
          title: "13. Governing law",
          paragraphs: [
            "Swedish law applies unless mandatory consumer protection in your country requires otherwise. Disputes should first be resolved through dialogue. Consumers may contact relevant dispute bodies in their jurisdiction.",
          ],
        },
        {
          title: "14. Contact",
          paragraphs: [`Terms questions: ${contactEmail}`],
        },
      ],
    },
    purchase: {
      title: "Purchase Terms",
      description:
        "Terms for purchasing digital premium subscriptions on BrainStats (Pro and Elite).",
      lastUpdated: "12 July 2026",
      sections: [
        {
          title: "1. Seller",
          paragraphs: [getSellerBlock("en"), companyInfo.vatNoteEn],
        },
        {
          title: "2. What is sold",
          paragraphs: [
            "BrainStats sells digital subscriptions to an AI-powered football analysis platform. The service is fully digital — no physical goods are delivered.",
            "The Free plan is free of charge and is not covered by these Purchase Terms. These terms apply to paid plans only.",
          ],
          bullets: [
            `Pro – ${companyInfo.plans.pro.priceEn}: unlimited AI analyses, deeper reports, full Brain Builder, saved history, form and statistics, up to 3 Brain Picks per analysis and 3 daily AI slips.`,
            `Elite – ${companyInfo.plans.elite.priceEn}: everything in Pro plus AI Match of the Day, Daily Brain Picks, Value Bets, priority AI and early access to new features, up to 5 Brain Picks per analysis and 5 daily AI slips.`,
            "The Free plan (0 SEK) is not covered by these Purchase Terms but provides limited access under the Terms of Service.",
          ],
        },
        {
          title: "3. Price and payment",
          bullets: [
            "The price shown on the premium page and in Stripe Checkout is the monthly price you pay.",
            "Payment is made in advance via Stripe (card or other payment methods offered by Stripe).",
            "The subscription renews automatically each month until you cancel.",
            "We may change prices for future billing periods with advance notice. Changes apply from the next billing period.",
          ],
        },
        {
          title: "4. Delivery and access",
          paragraphs: [
            "Premium features are activated digitally immediately after successful payment. Access is provided through your BrainStats account on the website.",
            "You are responsible for having working internet, a browser and valid login credentials.",
          ],
        },
        {
          title: "5. Term and cancellation",
          bullets: [
            "The agreement remains in force until you or BrainStats cancel the subscription.",
            "You can cancel at any time via the Stripe Customer Portal (Manage subscription in the dashboard).",
            "Cancellation stops future charges. You keep premium until the end of the paid period where Stripe applies this.",
            "BrainStats may suspend premium for breach of terms or failed payment.",
          ],
        },
        {
          title: "6. Right of withdrawal (distance sales)",
          paragraphs: [
            "As a consumer you normally have a 14-day right of withdrawal under distance selling rules when buying online.",
            "For digital services delivered immediately, an exception applies: if you expressly request immediate start and agree that the withdrawal right ends once delivery has begun, you lose the withdrawal right when premium is activated.",
            "Before purchase you are asked to confirm immediate access and that you have read the Purchase Terms.",
          ],
          bullets: [
            "If you have not requested immediate access, you may withdraw within 14 days by contacting us.",
            "For valid withdrawal within 14 days we refund within 14 days of receiving your notice.",
            "Withdrawal contact: " + contactEmail,
          ],
        },
        {
          title: "7. Complaints and service defects",
          paragraphs: [
            "If premium does not work as agreed despite reasonable attempts to fix the issue, contact us and we will investigate.",
            "Consumers may complain within a reasonable time after discovering a defect under applicable consumer service law.",
            "We may remedy the defect, offer a price reduction or in serious cases terminate the agreement under law.",
          ],
        },
        {
          title: "8. Refunds",
          bullets: [
            "Apart from statutory withdrawal rights, refunds are normally not given for an already started and used subscription period.",
            "For technical failures we cannot fix within a reasonable time, refund or credit may be offered at our discretion.",
            "Chargebacks are handled under Stripe rules and our records of delivered service.",
          ],
        },
        {
          title: "9. Personal data",
          paragraphs: [
            "Personal data is processed under our Privacy Policy. Payment details are handled by Stripe and are not fully stored by BrainStats.",
          ],
        },
        {
          title: "10. Dispute resolution",
          paragraphs: [
            "Contact us first with complaints and we will try to resolve the matter.",
            "Swedish consumers may contact the National Board for Consumer Disputes (ARN), arn.se.",
            "EU consumers may also use the EU Online Dispute Resolution (ODR) platform.",
          ],
        },
        {
          title: "11. Contact",
          paragraphs: [`Purchases, withdrawal and complaints: ${contactEmail}`],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "How BrainStats collects, uses and protects personal data under GDPR.",
      lastUpdated: "12 July 2026",
      sections: [
        {
          title: "1. Data controller",
          paragraphs: [
            getSellerBlock("en"),
            `BrainStats (${website}) is the data controller for personal data processed in connection with the service.`,
            `Privacy contact: ${contactEmail}`,
          ],
        },
        {
          title: "2. Data we collect",
          bullets: [
            "Account data: email address and authentication data via Supabase.",
            "Subscription data: plan, payment status and Stripe customer ID.",
            "Usage data: analyses you create, dashboard history and daily AI slips.",
            "Technical data: IP address, device, browser and security logs.",
            "Analysis input: matches, markets and text you submit for AI analysis.",
            "Language preference stored locally in the browser (localStorage).",
          ],
        },
        {
          title: "3. Why we process data",
          bullets: [
            "Provide and improve the service (contract).",
            "Manage login, account and premium (contract).",
            "Payments and billing via Stripe (contract / legal obligation).",
            "Security, debugging and abuse prevention (legitimate interest).",
            "Anonymous visit statistics via Vercel Analytics (legitimate interest / consent where required).",
          ],
        },
        {
          title: "4. AI and subprocessors",
          paragraphs: [
            "We use trusted providers to deliver the service:",
            "Data may be processed outside the EU/EEA where required by providers. We rely on appropriate safeguards such as standard contractual clauses where needed.",
          ],
          bullets: [
            "Supabase – authentication and database.",
            "Stripe – payments and subscriptions.",
            "OpenAI – AI-generated analyses based on match data you request.",
            "API-Football – match, team and statistics data.",
            "Vercel – hosting and anonymous analytics.",
          ],
        },
        {
          title: "5. Retention",
          bullets: [
            "Account data is kept until you delete your account or request deletion.",
            "Analysis history is stored to power dashboard and reports.",
            "Payment records follow Stripe policies and legal requirements.",
            "Technical logs are kept for a limited period.",
          ],
        },
        {
          title: "6. Your rights",
          bullets: [
            "Access your personal data.",
            "Request correction of inaccurate data.",
            "Request deletion (subject to legal requirements).",
            "Request restriction of processing.",
            "Object to certain processing based on legitimate interest.",
            "Data portability where applicable.",
            "Lodge a complaint with your supervisory authority.",
          ],
          paragraphs: [`To exercise your rights, contact ${contactEmail}.`],
        },
        {
          title: "7. Security",
          paragraphs: [
            "We use technical and organisational measures to protect your data, including HTTPS encryption, access controls and limited production access.",
          ],
        },
        {
          title: "8. Children",
          paragraphs: [
            "BrainStats is not directed at anyone under 18 and we do not knowingly collect data from children.",
          ],
        },
        {
          title: "9. Changes",
          paragraphs: [
            "We may update this policy. The latest version is always published on the website with an updated date.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      description:
        "Information about cookies, local storage and similar technologies on BrainStats.",
      lastUpdated: "12 July 2026",
      sections: [
        {
          title: "1. What are cookies?",
          paragraphs: [
            "Cookies are small text files stored in your browser. We also use local storage for certain settings.",
          ],
        },
        {
          title: "2. What we use",
          bullets: [
            "Essential cookies/sessions via Supabase for login and security.",
            "Language preference (localStorage: brainstats-language) for SV/EN.",
            "Cookie consent (localStorage: brainstats-cookie-consent).",
            "Anonymous visit statistics via Vercel Analytics to understand traffic and improve the service.",
          ],
        },
        {
          title: "3. Consent",
          paragraphs: [
            "Essential features are required for the service to work. Analytics cookies are enabled after your consent via the cookie banner where required by law.",
          ],
        },
        {
          title: "4. Managing cookies",
          paragraphs: [
            "You can block or delete cookies in your browser settings. Blocking essential cookies may break login and some features.",
          ],
        },
        {
          title: "5. Contact",
          paragraphs: [`Cookie questions: ${contactEmail}`],
        },
      ],
    },
    disclaimer: {
      title: "Disclaimer",
      description:
        "Important information about AI analyses, responsible gambling and risk.",
      lastUpdated: "12 July 2026",
      sections: [
        {
          title: "1. BrainStats is not a bookmaker",
          paragraphs: [
            "BrainStats provides analysis, statistics and AI-based insights. We do not offer betting, odds, stake collection or payouts.",
          ],
        },
        {
          title: "2. No guarantee of results",
          paragraphs: [
            "All analyses, BrainScore values, probabilities and AI suggestions are estimates based on available data. Football has high variance. Past performance is not a guarantee of future results.",
          ],
        },
        {
          title: "3. Gamble responsibly",
          bullets: [
            "Only gamble if you are 18+ and it is legal in your country.",
            "Never stake more than you can afford to lose.",
            "Take breaks and seek help if gambling feels problematic.",
          ],
          paragraphs: [
            "Sweden: Stödlinjen – stodlinjen.se, phone 020-81 91 00.",
            "International: visit BeGambleAware.org or an equivalent organisation in your country.",
          ],
        },
        {
          title: "4. AI limitations",
          paragraphs: [
            "AI may hallucinate, miss injuries, delays or late team news. Always verify important information close to kick-off. BrainStats is not professional advice.",
          ],
        },
        {
          title: "5. Fair odds and AI slips",
          paragraphs: [
            "Estimated fair odds shown in analyses and Daily Brain Picks are AI-based comparison values — not live bookmaker odds and not an offer to place bets.",
            "AI Match of the Day, Value Bets and Brain Picks are suggestions and analyses, not guarantees or recommendations to stake money with third parties.",
          ],
        },
        {
          title: "6. External data",
          paragraphs: [
            "Match data comes from third-party providers and may be delayed or incorrect. We are not responsible for external data errors.",
          ],
        },
        {
          title: "7. Contact",
          paragraphs: [`Questions: ${contactEmail}`],
        },
      ],
    },
  },
};

export function getLegalDocument(
  language: Language,
  slug: LegalSlug
): LegalDocument {
  return documents[language][slug];
}
