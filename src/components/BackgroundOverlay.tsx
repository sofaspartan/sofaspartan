export const BackgroundOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <video 
        src="/Digital Error Noise Background (4).mov"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-20"
      />
    </div>
  );
}; 