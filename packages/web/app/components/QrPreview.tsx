export function QrPreview({ svg }: { svg: string }) {
  return <div data-testid="qr-preview" dangerouslySetInnerHTML={{ __html: svg }} />
}
