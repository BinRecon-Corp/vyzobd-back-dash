import { sanitizeRichText, validateRichTextUrls, sanitizeObjectWithRichText, RICH_TEXT_FIELDS } from "../utils/richTextSanitizer";

async function runRichTextSanitizerTests() {
  console.log("\n=================================================");
  console.log("RICH TEXT SANITIZATION & SECURITY TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string, details?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${details ? `: ${details}` : ""}`);
      failed++;
    }
  };

  try {
    // 1. XSS Prevention: Script Tags
    const scriptPayload = '<h1>Title</h1><script>alert("XSS")</script><p>Paragraph</p>';
    const sanitizedScript = sanitizeRichText(scriptPayload);
    assert(
      !sanitizedScript.includes('<script>') && !sanitizedScript.includes('alert') && sanitizedScript.includes('<h1>Title</h1>') && sanitizedScript.includes('<p>Paragraph</p>'),
      "TEST 1: Strips <script> tags and JS code while preserving surrounding HTML"
    );

    // 2. XSS Prevention: Event Handler Attributes
    const onerrorPayload = '<img src="invalid.jpg" onerror="alert(document.cookie)" alt="Test Image" />';
    const sanitizedOnerror = sanitizeRichText(onerrorPayload);
    assert(
      !sanitizedOnerror.includes('onerror') && !sanitizedOnerror.includes('document.cookie') && sanitizedOnerror.includes('alt="Test Image"'),
      "TEST 2: Strips inline event handlers (onerror) from <img> tags"
    );

    // 3. XSS Prevention: Dangerous iFrames
    const iframePayload = '<p>Check this out:</p><iframe src="https://evil-site.com/phishing"></iframe>';
    const sanitizedIframe = sanitizeRichText(iframePayload);
    assert(
      !sanitizedIframe.includes('<iframe') && !sanitizedIframe.includes('evil-site.com') && sanitizedIframe.includes('<p>Check this out:</p>'),
      "TEST 3: Strips dangerous <iframe> tags completely"
    );

    // 4. XSS Prevention: javascript: URLs in Links
    const jsLinkPayload = '<a href="javascript:alert(\'XSS\')">Click Here</a>';
    const sanitizedJsLink = sanitizeRichText(jsLinkPayload);
    assert(
      !sanitizedJsLink.includes('javascript:') && !sanitizedJsLink.includes('alert'),
      "TEST 4: Strips javascript: URI scheme from <a> links"
    );

    // 5. XSS Prevention: Dangerous Embedded Content (object, embed, form)
    const embeddedPayload = '<object data="exploit.swf"></object><embed src="flash.swf"><form action="https://phish.com"><input type="text"></form>';
    const sanitizedEmbedded = sanitizeRichText(embeddedPayload);
    assert(
      !sanitizedEmbedded.includes('<object') && !sanitizedEmbedded.includes('<embed') && !sanitizedEmbedded.includes('<form'),
      "TEST 5: Strips dangerous embedded content (<object>, <embed>, <form>)"
    );

    // 6. Legitimate Formatting: Paragraphs, Headings, Lists, Formatting
    const richTextContent = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <p>This is a <strong>bold</strong>, <em>italic</em>, <u>underlined</u>, and <s>strikethrough</s> text with <code>inline code</code>.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
      <ol>
        <li>Numbered one</li>
      </ol>
      <blockquote>A wise quotation</blockquote>
      <hr />
    `.trim();
    const sanitizedRichText = sanitizeRichText(richTextContent);
    assert(
      sanitizedRichText.includes('<h1>Heading 1</h1>') &&
      sanitizedRichText.includes('<h2>Heading 2</h2>') &&
      sanitizedRichText.includes('<strong>bold</strong>') &&
      sanitizedRichText.includes('<em>italic</em>') &&
      sanitizedRichText.includes('<u>underlined</u>') &&
      sanitizedRichText.includes('<s>strikethrough</s>') &&
      sanitizedRichText.includes('<code>inline code</code>') &&
      sanitizedRichText.includes('<li>First item</li>') &&
      sanitizedRichText.includes('<blockquote>A wise quotation</blockquote>') &&
      sanitizedRichText.includes('<hr'),
      "TEST 6: Preserves legitimate paragraphs, headings, lists, formatting, blockquotes, and hr tags intact"
    );

    // 7. Legitimate Links with target="_blank" and rel
    const linkContent = '<a href="https://example.com/product" target="_blank" title="Product Link">View Product</a>';
    const sanitizedLink = sanitizeRichText(linkContent);
    assert(
      sanitizedLink.includes('href="https://example.com/product"') &&
      sanitizedLink.includes('target="_blank"') &&
      sanitizedLink.includes('rel="noopener noreferrer"') &&
      sanitizedLink.includes('View Product'),
      "TEST 7: Preserves safe HTTP/HTTPS links and automatically enforces rel=\"noopener noreferrer\" for target=\"_blank\""
    );

    // 8. Legitimate Images with Alignment and Dimensions
    const imageContent = '<img src="https://res.cloudinary.com/demo/image/upload/sample.jpg" alt="Sample Product" width="600" height="400" style="text-align: center;" data-alignment="center" />';
    const sanitizedImage = sanitizeRichText(imageContent);
    assert(
      sanitizedImage.includes('src="https://res.cloudinary.com/demo/image/upload/sample.jpg"') &&
      sanitizedImage.includes('alt="Sample Product"') &&
      sanitizedImage.includes('width="600"') &&
      sanitizedImage.includes('data-alignment="center"'),
      "TEST 8: Preserves Cloudinary/HTTPS image URLs, dimensions, alt text, and alignment attributes"
    );

    // 9. Safe CSS Styling & Alignment
    const styledContent = '<p style="text-align: center; color: #ff0000; background-color: #ffffff;">Centered Text</p>';
    const sanitizedStyled = sanitizeRichText(styledContent);
    assert(
      sanitizedStyled.includes('text-align: center') || sanitizedStyled.includes('text-align:center'),
      "TEST 9: Allows safe CSS inline styles for text alignment and colors"
    );

    // 10. URL Validator Helper Test
    const urlValidation1 = validateRichTextUrls('<p>Safe content <a href="https://google.com">link</a></p>');
    const urlValidation2 = validateRichTextUrls('<p>Malicious <script>alert(1)</script> <a href="javascript:alert(1)">click</a></p>');
    assert(
      urlValidation1.isValid === true && urlValidation1.errors.length === 0 &&
      urlValidation2.isValid === false && urlValidation2.errors.length > 0,
      "TEST 10: validateRichTextUrls correctly identifies clean vs malicious payload error flags"
    );

    // 11. Object Sanitizer Helper Test (Product / Blog / Page entity object)
    const entityObj = {
      name: "Smart Watch",
      description: "<h3>Feature List</h3><ul><li>Water resistant</li></ul><script>alert(1)</script>",
      shortDescription: "<p>Best smartwatch <img src=x onerror=alert(1)></p>",
      price: 199.99,
      tags: ["tech", "gadget"],
    };
    const sanitizedEntity = sanitizeObjectWithRichText(entityObj, RICH_TEXT_FIELDS);
    assert(
      sanitizedEntity.name === "Smart Watch" &&
      sanitizedEntity.description.includes("<h3>Feature List</h3>") &&
      !sanitizedEntity.description.includes("<script>") &&
      sanitizedEntity.shortDescription.includes("<p>Best smartwatch") &&
      !sanitizedEntity.shortDescription.includes("onerror"),
      "TEST 11: sanitizeObjectWithRichText sanitizes entity rich-text fields while leaving primitive data intact"
    );

    console.log("\n=================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runRichTextSanitizerTests();
