type HugeIconDefinition =
  typeof import('@hugeicons/core-free-icons').Menu01Icon;

declare module '@hugeicons/core-free-icons/*' {
  const icon: HugeIconDefinition;
  export default icon;
}
