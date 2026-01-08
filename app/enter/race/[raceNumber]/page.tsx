export default function EnterRacePage({
  params,
}: {
  params: { raceNumber: string };
}) {
  return <main>Enter: Race #{params.raceNumber}</main>;
}
