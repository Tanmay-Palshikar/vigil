// This data is used by the frontend team (Dev 2) for UI development in Sprint 1.
// It must perfectly match the `riskIncident.model.js` schema.

export const mockRiskData = [
  {
    _id: "1",
    sourceUrl: "https://example-news.com/article-on-ceo",
    scrapedContentSnippet: "In a recent interview, the CEO of ExampleCorp made several controversial statements that have sparked public debate...",
    aiAnalysis: {
      isRisk: true,
      riskCategory: "Reputational",
      riskLevel: "High",
      justification: "The article contains negative sentiment regarding the company's leadership and controversial quotes, which could significantly damage public trust and brand image.",
      mitigationStrategy: "Prepare a public relations statement to clarify the CEO's statements and address public concerns. Monitor social media for related conversations and engage constructively.",
    },
    createdAt: "2025-10-26T10:00:00.000Z",
  },
  {
    _id: "2",
    sourceUrl: "https://www.example.com",
    // This object intentionally has no `scrapedContentSnippet` to test conditional rendering.
    aiAnalysis: {
      isRisk: true,
      riskCategory: "Security",
      riskLevel: "Medium",
      justification: "The SSL certificate for the main corporate website is set to expire in 25 days. Failure to renew will result in browser security warnings for all visitors.",
      mitigationStrategy: "Contact the IT department or domain registrar immediately to renew the SSL certificate for www.example.com. Plan to renew at least 45 days before expiration in the future.",
    },
    createdAt: "2025-10-25T14:30:00.000Z",
  },
  {
    _id: "3",
    sourceUrl: "https://tech-compliance-journal.com/gdpr-fines-2025",
    scrapedContentSnippet: "A report published today lists ExampleCorp among several companies potentially violating GDPR by not providing a clear cookie consent mechanism.",
    aiAnalysis: {
      isRisk: true,
      riskCategory: "Compliance",
      riskLevel: "Medium",
      justification: "The company is mentioned in a public report regarding potential GDPR violations. This could lead to official investigations and significant financial penalties.",
      mitigationStrategy: "Initiate an immediate internal audit of the website's cookie consent banner and privacy policy to ensure full GDPR compliance. Consult with legal counsel to address the claims in the report.",
    },
    createdAt: "2025-10-24T09:00:00.000Z",
  },
];

