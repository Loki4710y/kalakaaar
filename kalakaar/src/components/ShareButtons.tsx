'use client'

import React from 'react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../contexts/LanguageContext'

interface ShareProps {
  title: string
  price?: number
  artistName?: string
  url: string
  image_urls?: string[]
}

export default function ShareButtons({ 
  title, price, artistName, url, image_urls 
}: ShareProps) {

  const { t } = useLanguage()

  const shareText = price 
    ? `🎨 "${title}" by ${artistName}\n💰 ₹${price}\n\nDiscover Indian art on Kalakaar!\n${url}`
    : `🎨 Check out ${artistName}'s art on Kalakaar!\n${url}`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
  const instagramUrl = `https://www.instagram.com/`

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    toast.success(t('share.copied'))
  }

  const shareNative = async () => {
    if (navigator?.share) {
      await navigator.share({
        title: title,
        text: shareText,
        url: url
      })
    } else {
      copyLink()
    }
  }

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <span className="text-xs font-bold uppercase tracking-wider text-[#6B1E2E]/80 mr-1 font-sans">{t('share.label')}</span>
      
      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share artwork on WhatsApp"
        className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] text-white rounded-full text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 transition-all font-sans uppercase tracking-wider shadow-xs"
      >
        WhatsApp
      </a>

      {/* Facebook */}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share artwork on Facebook"
        className="flex items-center gap-1 px-3 py-1.5 bg-[#1877F2] text-white rounded-full text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 transition-all font-sans uppercase tracking-wider hidden sm:flex shadow-xs"
      >
        Meta
      </a>

      {/* Twitter (X) */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share artwork on X (formerly Twitter)"
        className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-all font-sans uppercase tracking-wider hidden sm:flex shadow-xs"
      >
        X
      </a>

      {/* LinkedIn */}
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share artwork on LinkedIn"
        className="flex items-center gap-1 px-3 py-1.5 bg-[#0A66C2] text-white rounded-full text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2 transition-all font-sans uppercase tracking-wider hidden sm:flex shadow-xs"
      >
        LinkedIn
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy artwork link to clipboard"
        className="flex items-center gap-1 px-3 py-1.5 border border-[#6B1E2E] text-[#6B1E2E] rounded-full text-xs font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] focus-visible:ring-offset-2 transition-all font-sans uppercase tracking-wider cursor-pointer"
      >
        {t('share.copyLink')}
      </button>

      {/* Native share */}
      <button
        type="button"
        onClick={shareNative}
        aria-label="Open device native share menu"
        className="flex items-center gap-1 px-3 py-1.5 border border-[#6B1E2E] text-[#6B1E2E] rounded-full text-xs font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] focus-visible:ring-offset-2 transition-all font-sans uppercase tracking-wider cursor-pointer"
      >
        {t('share.share')}
      </button>

      {/* Instagram tooltip pattern */}
      <a 
         href={instagramUrl}
         target="_blank" 
         rel="noopener noreferrer"
         aria-label="Share link to Instagram"
         onClick={() => {
            navigator.clipboard.writeText(url);
            toast.success("Link copied! Paste in IG bio/story!");
         }}
         className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-full text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2743] focus-visible:ring-offset-2 transition-all shadow-xs"
         title="Copy link and open Instagram"
      >
         IG
      </a>
    </div>
  )
}
