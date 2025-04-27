import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link, Twitter, Facebook, Mail } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ url, title }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setShowDropdown(false);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async (platform: string) => {
    const shareData = {
      title: title,
      url: url
    };

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
    }

    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2c2c2c] border border-white/20 text-gray-400 hover:text-white transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 bg-[#2c2c2c] border border-white/20 rounded-lg shadow-lg p-2 z-[9999] w-48">
          <div className="flex flex-col gap-1">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded transition-colors w-full text-left"
            >
              <Link className="w-4 h-4 flex-shrink-0" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded transition-colors w-full text-left"
            >
              <Twitter className="w-4 h-4 flex-shrink-0" />
              <span>Share on Twitter</span>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded transition-colors w-full text-left"
            >
              <Facebook className="w-4 h-4 flex-shrink-0" />
              <span>Share on Facebook</span>
            </button>
            <button
              onClick={() => handleShare('email')}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded transition-colors w-full text-left"
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>Share via Email</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton; 