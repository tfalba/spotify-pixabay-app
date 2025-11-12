import SpotifySearch from "./SpotifySearch";
import PlaylistPicker from "./PlaylistPicker";

export default function TracksListsContainer({
  onPick,
  selectedTrackId,
  handleQueueChange,
}: {
  onPick: (track: any) => void;
  selectedTrackId: string | null | undefined;
  handleQueueChange: (tracks: any[]) => void;
}) {
  return (
    <section
      className="xl:col-span-1
           flex min-w-0 flex-col max-h-[600px] rounded-3xl border border-[amber]/80 p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-y-scroll"
    >
      <SpotifySearch onPick={onPick} selectedTrackId={selectedTrackId} />
      <PlaylistPicker
        onPick={onPick}
        selectedTrackId={selectedTrackId}
        onQueueChange={handleQueueChange}
      />

      {/* {children} */}
    </section>
  );
}
