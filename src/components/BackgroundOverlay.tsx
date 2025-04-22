export const BackgroundOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <video 
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-20"
      />
    </div>
  );
}; 