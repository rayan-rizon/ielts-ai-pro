import { toRoman } from '../../../utils/helpers';

export {
  getCircleStatus,
  getValidationInputStyle,
} from '@/features/testing/shared/questionUiTokens';

export function getFeatureLabel(idx, style) {
  if (style === 'ROMAN') {
    return toRoman(idx + 1).toLowerCase();
  }
  return String.fromCharCode(65 + idx);
}
