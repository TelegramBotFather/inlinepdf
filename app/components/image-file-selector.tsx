import { PdfFileSelector } from './pdf-file-selector';

interface ImageFileSelectorProps {
  disabled?: boolean;
  multiple?: boolean;
  onSelect: (files: File[]) => void;
  ariaLabel: string;
  variant?: 'dropzone' | 'inline' | 'tile';
  buttonLabel?: string;
}

export function ImageFileSelector({
  disabled,
  multiple,
  onSelect,
  ariaLabel,
  variant,
  buttonLabel,
}: ImageFileSelectorProps) {
  return (
    <PdfFileSelector
      disabled={disabled}
      multiple={multiple}
      onSelect={onSelect}
      ariaLabel={ariaLabel}
      accept="image/jpeg,.jpg,.jpeg,image/png,.png"
      variant={variant}
      buttonLabel={buttonLabel}
    />
  );
}
