import { describe, expect, it } from 'vitest';

import {
  getImageToPdfWorkspaceViewModel,
  getUnsupportedImageMessage,
} from '~/tools/image-to-pdf/use-image-to-pdf-workspace';

describe('getImageToPdfWorkspaceViewModel', () => {
  it('enables conversion when files are queued and the action is idle', () => {
    const viewModel = getImageToPdfWorkspaceViewModel({
      fileCount: 2,
      isConverting: false,
      localErrorMessage: null,
      actionErrorMessage: null,
    });

    expect(viewModel.canConvert).toBe(true);
    expect(viewModel.convertButtonLabel).toBe('Create PDF');
    expect(viewModel.helperText).toBeNull();
  });

  it('prefers local errors and blocks conversion while busy', () => {
    const viewModel = getImageToPdfWorkspaceViewModel({
      fileCount: 3,
      isConverting: true,
      localErrorMessage: 'local error',
      actionErrorMessage: 'route error',
    });

    expect(viewModel.canConvert).toBe(false);
    expect(viewModel.convertButtonLabel).toBe('Converting...');
    expect(viewModel.errorMessage).toBe('local error');
    expect(viewModel.helperText).toBe('Creating PDF...');
  });
});

describe('getUnsupportedImageMessage', () => {
  it('builds the unsupported file message when needed', () => {
    expect(getUnsupportedImageMessage('bad.gif')).toBe(
      'Only JPG and PNG images are supported. bad.gif is not supported.',
    );
  });

  it('returns null when every file is supported', () => {
    expect(getUnsupportedImageMessage(null)).toBeNull();
  });
});
