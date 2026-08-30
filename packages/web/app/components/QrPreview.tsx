export function QrPreview({ svg }: { svg: string }) {
  return (
    <div className="preview-frame">
      <div data-testid="qr-preview" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
