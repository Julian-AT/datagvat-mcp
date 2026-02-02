import { gateway } from '@ai-sdk/gateway';
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { google } from '@ai-sdk/google';

const THINKING_SUFFIX_REGEX = /-thinking$/;

export function getLanguageModel(modelId: string) {
  // const isReasoningModel = modelId.includes('reasoning') || modelId.endsWith('-thinking');

  // if (isReasoningModel) {
  //   const gatewayModelId = modelId.replace(THINKING_SUFFIX_REGEX, '');

  //   return wrapLanguageModel({
  //     model: gateway.languageModel(gatewayModelId),
  //     middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
  //   });
  // }

  // return gateway.languageModel(modelId);

  return google('gemini-2.5-flash')
}

export function getTitleModel() {
  return google('gemini-2.5-flash-lite');
}

export function getArtifactModel() {
  return google('gemini-2.5-flash-lite');
}
