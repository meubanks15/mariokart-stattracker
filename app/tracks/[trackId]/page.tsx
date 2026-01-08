export default function TrackDetailPage({
  params,
}: {
  params: { trackId: string };
}) {
  return <main>Track: {params.trackId}</main>;
}
