export const ROLES_CONFIG = [
  { 
    id: 'Music & Audio', 
    label: 'Music & Audio', 
    specializations: [
      'Musician', 'Artist', 'Singer', 'Vocalist', 'Rapper', 'Songwriter', 'Music Producer', 'Beat Producer', 
      'Sound Engineer', 'Mixing Engineer', 'Mastering Engineer', 'Audio Engineer', 'Recording Engineer', 
      'DJ', 'Instrumentalist', 'Guitarist', 'Pianist', 'Drummer', 'Saxophonist', 'Violinist', 'Bassist', 
      'Composer', 'Choir Director', 'Music Director', 'Voice Coach', 'Voiceover Artist', 'Podcaster', 
      'Radio Host', 'Audio Storyteller', 'Spoken Word Artist', 'Music Arranger', 'Live Performer', 
      'Backup Vocalist', 'Sound Designer', 'Foley Artist', 'Audio Editor'
    ]
  },
  { 
    id: 'Film, TV & Video', 
    label: 'Film, TV & Video', 
    specializations: [
      'Filmmaker', 'Director', 'Assistant Director', 'Cinematographer', 'Videographer', 'Video Editor', 
      'Colorist', 'Screenwriter', 'Scriptwriter', 'Documentary Filmmaker', 'Creative Director', 'Producer', 
      'Executive Producer', 'Production Manager', 'Camera Operator', 'Drone Operator', 'Film Editor', 
      'Motion Graphics Artist', 'Visual Effects Artist', 'Animator', '2D Animator', '3D Animator', 
      'Storyboard Artist', 'Set Designer', 'Lighting Technician', 'Production Assistant', 'Boom Operator', 
      'TV Presenter', 'Broadcaster', 'Streamer', 'YouTuber', 'Content Producer', 'Reel Creator', 'Short Film Creator'
    ]
  },
  { 
    id: 'Photography & Visual Arts', 
    label: 'Photography & Visual Arts', 
    specializations: [
      'Photographer', 'Portrait Photographer', 'Fashion Photographer', 'Event Photographer', 'Street Photographer', 
      'Documentary Photographer', 'Photojournalist', 'Retoucher', 'Photo Editor', 'Visual Artist', 'Digital Artist', 
      'Illustrator', 'Painter', 'Sketch Artist', 'Cartoonist', 'Comic Artist', 'Concept Artist', 'Mural Artist', 
      'Graffiti Artist', 'Collage Artist', 'Fine Artist', 'NFT Artist', 'Print Artist', 'Mixed Media Artist', 
      'Sculptor', 'Ceramic Artist', 'Installation Artist', 'Art Director', 'Gallery Curator'
    ]
  },
  { 
    id: 'Writing & Content', 
    label: 'Writing & Content', 
    specializations: [
      'Writer', 'Author', 'Poet', 'Blogger', 'Journalist', 'Copywriter', 'Scriptwriter', 'Ghostwriter', 
      'Editor', 'Proofreader', 'Technical Writer', 'Creative Writer', 'Novelist', 'Essayist', 'Storyteller', 
      'Spoken Word Creator', 'Newsletter Writer', 'SEO Writer', 'Social Media Writer', 'Content Creator', 
      'UGC Creator', 'Influencer', 'Lifestyle Creator', 'Educational Creator', 'Tech Creator', 'Commentary Creator', 
      'Reviewer', 'Meme Creator'
    ]
  },
  { 
    id: 'Acting & Performance', 
    label: 'Acting & Performance', 
    specializations: [
      'Actor', 'Actress', 'Performer', 'Theatre Actor', 'Stage Performer', 'Voice Actor', 'Comedian', 
      'Skit Maker', 'MC', 'Event Host', 'Presenter', 'TV Personality', 'Live Entertainer', 'Dancer', 
      'Choreographer', 'Dance Instructor', 'Performance Artist', 'Circus Performer', 'Mime Artist', 
      'Puppeteer', 'Magician'
    ]
  },
  { 
    id: 'Fashion & Beauty', 
    label: 'Fashion & Beauty', 
    specializations: [
      'Fashion Designer', 'Stylist', 'Personal Stylist', 'Costume Designer', 'Wardrobe Stylist', 'Makeup Artist', 
      'Beauty Creator', 'Hair Stylist', 'Barber', 'Nail Artist', 'Fashion Illustrator', 'Model', 'Runway Model', 
      'Commercial Model', 'Fashion Content Creator', 'Jewelry Designer', 'Textile Designer', 'Fashion Photographer', 
      'Fashion Creative Director'
    ]
  },
  { 
    id: 'Design & Creative Tech', 
    label: 'Design & Creative Tech', 
    specializations: [
      'Graphic Designer', 'UI Designer', 'UX Designer', 'Product Designer', 'Web Designer', 'Brand Designer', 
      'Motion Designer', '3D Designer', 'Industrial Designer', 'Packaging Designer', 'Visual Designer', 
      'Typography Designer', 'Presentation Designer', 'Creative Technologist', 'AR Creator', 'VR Creator', 
      'Game Designer', 'Game Artist', 'Level Designer', 'Indie Game Developer'
    ]
  },
  { 
    id: 'Digital & Social Creators', 
    label: 'Digital & Social Creators', 
    specializations: [
      'Social Media Creator', 'TikTok Creator', 'Instagram Creator', 'YouTube Creator', 'Twitch Streamer', 
      'Live Streamer', 'Gaming Creator', 'Reaction Creator', 'Vlogger', 'Lifestyle Influencer', 'Travel Creator', 
      'Food Creator', 'Fitness Creator', 'Educational Influencer', 'Motivational Speaker', 'Business Creator', 
      'Finance Creator', 'Comedy Creator'
    ]
  },
  { 
    id: 'Event & Entertainment Industry', 
    label: 'Event & Entertainment Industry', 
    specializations: [
      'Event Planner', 'Event Curator', 'Concert Organizer', 'Festival Organizer', 'Talent Manager', 'Artist Manager', 
      'Booking Agent', 'Talent Scout', 'Casting Director', 'Casting Scout', 'A&R Representative', 'Entertainment Executive', 
      'Creative Consultant', 'Brand Strategist', 'Community Manager', 'Publicist', 'PR Manager'
    ]
  },
  { 
    id: 'Brand & Agency', 
    label: 'Brand & Agency Profiles', 
    specializations: [
      'Brand', 'Agency', 'Creative Agency', 'Production House', 'Record Label', 'Media Company', 'Fashion Brand', 
      'Marketing Agency', 'Talent Agency', 'Creative Studio', 'Entertainment Company', 'Publishing Company', 
      'Film Studio', 'Startup', 'Nonprofit Organization'
    ]
  },
  { 
    id: 'Education & Community', 
    label: 'Creative Education & Community', 
    specializations: [
      'Creative Coach', 'Mentor', 'Workshop Host', 'Creative Educator', 'Art Teacher', 'Music Teacher', 
      'Dance Instructor', 'Acting Coach', 'Community Builder', 'Creative Curator', 'Creative Recruiter', 
      'Industry Speaker', 'Creative Consultant'
    ]
  }
];

export const getSpecializationsForRole = (roleId) => {
  const role = ROLES_CONFIG.find(r => r.id === roleId || r.label === roleId);
  return role ? role.specializations : [];
};
