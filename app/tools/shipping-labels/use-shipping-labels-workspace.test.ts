import { describe, expect, it } from 'vitest';

import { buildShippingLabelsViewModel } from '~/tools/shipping-labels/use-shipping-labels-workspace';

describe('buildShippingLabelsViewModel', () => {
  it('enables preparation for supported brands with a selected file', () => {
    const viewModel = buildShippingLabelsViewModel({
      brand: 'meesho',
      selectedFile: true,
      isPreparing: false,
      localErrorMessage: null,
      actionErrorMessage: null,
      result: {
        fileName: 'labels.pdf',
        labelsPrepared: 3,
        pagesProcessed: 4,
        pagesSkipped: 1,
      },
    });

    expect(viewModel.isBrandAvailable).toBe(true);
    expect(viewModel.prepareButtonDisabled).toBe(false);
    expect(viewModel.resultSummary?.brandLabel).toBe('Meesho');
  });

  it('blocks unsupported brands and prefers local errors', () => {
    const viewModel = buildShippingLabelsViewModel({
      brand: 'amazon',
      selectedFile: true,
      isPreparing: false,
      localErrorMessage: 'local',
      actionErrorMessage: 'action',
      result: null,
    });

    expect(viewModel.isBrandAvailable).toBe(false);
    expect(viewModel.prepareButtonDisabled).toBe(true);
    expect(viewModel.errorMessage).toBe('local');
  });
});
