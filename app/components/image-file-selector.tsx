import { PdfFileSelector } from './pdf-file-selector';

interface ImageFileSelectorProps {
  disabled?: boolean;
  multiple?: boolean;
  onSelect: (files: File[]) => void;
  ariaLabel: string;
  variant?: 'dropzone' | 'inline';
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export function ImageFileSelector({
  disabled,
  multiple,
  onSelect,
  ariaLabel,
  variant,
  title,
  description,
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
      title={title}
      description={description}
      buttonLabel={buttonLabel}
    />
  );
}
