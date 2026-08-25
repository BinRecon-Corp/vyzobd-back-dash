import { ISmsProvider, SmsSendOptions, SmsSendResult } from "./sms.provider";

export class MockSmsProvider implements ISmsProvider {
  async sendSms(options: SmsSendOptions): Promise<SmsSendResult> {
    console.log(`[MOCK SMS] To: ${options.to} | Message: ${options.message}`);
    return {
      success: true,
      providerMessageId: "mock-" + Date.now(),
    };
  }
}
