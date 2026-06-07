import React from 'react';

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 120" 
      width="100%" 
      height="100%" 
      className="drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
      {...props}
    >
      <defs>
        {/* Neon Gradient for the Icon */}
        <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" /> {/* Neon Pink */}
          <stop offset="50%" stopColor="#8b5cf6" /> {/* Electric Purple */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyber Cyan */}
        </linearGradient>
        
        {/* Soft Glow Filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(10, 10)">
        {/* Futuristic Gaming Icon */}
        <g id="logo-icon" filter="url(#glow)">
          {/* Outer Cyber Brain Hexagon */}
          <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" fill="none" stroke="url(#cyberGradient)" strokeWidth="4" strokeLinejoin="round" />
          
          {/* Inner AI Core Glowing Nodes */}
          <circle cx="50" cy="35" r="5" fill="#06b6d4" />
          <circle cx="35" cy="60" r="4" fill="#ec4899" />
          <circle cx="65" cy="60" r="4" fill="#ec4899" />
          <circle cx="50" cy="75" r="6" fill="#8b5cf6" />
          
          {/* Connection Neural Lines */}
          <line x1="50" y1="35" x2="35" y2="60" stroke="url(#cyberGradient)" strokeWidth="2" />
          <line x1="50" y1="35" x2="65" y2="60" stroke="url(#cyberGradient)" strokeWidth="2" />
          <line x1="35" y1="60" x2="50" y2="75" stroke="url(#cyberGradient)" strokeWidth="2" />
          <line x1="65" y1="60" x2="50" y2="75" stroke="url(#cyberGradient)" strokeWidth="2" />
        </g>

        {/* Premium Brand Typography */}
        <g id="brand-text" transform="translate(110, 65)">
          {/* "Context" in Bold Modern Sans */}
          <text fontFamily="system-ui, -apple-system, sans-serif" fontSize="42" fontWeight="900" fill="#ffffff" letterSpacing="1">
            Context
          </text>
          
          {/* "le" with Neon Gradient */}
          <text x="172" fontFamily="system-ui, -apple-system, sans-serif" fontSize="42" fontWeight="900" fill="url(#cyberGradient)" letterSpacing="1">
            le
          </text>
          
          {/* ".ai" in Futuristic Tech Cyan */}
          <text x="210" fontFamily="system-ui, -apple-system, sans-serif" fontSize="42" fontWeight="300" fill="#06b6d4" letterSpacing="2">
            .ai
          </text>
        </g>
      </g>
    </svg>
  );
};
