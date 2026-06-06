import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Loader2, AlertCircle, ChevronRight, ChevronLeft, Check, 
  Music, Film, Camera, PenTool, Mic2, Scissors, Palette, Smartphone, 
  Calendar, Briefcase, BookOpen, ArrowLeft, Eye, EyeOff, Sparkles, Target, Search,
  Layers, Tag, Handshake, Rocket, ArrowRight
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

// Exhaustive Categories Data
const CATEGORIES = [
  { id: 'Music & Audio', icon: Music, label: 'Music & Audio', subtitle: 'Producers, Engineers, Musicians', specializations: [
    'Musician', 'Artist', 'Singer', 'Vocalist', 'Rapper', 'Songwriter', 'Music Producer', 'Beat Producer', 
    'Sound Engineer', 'Mixing Engineer', 'Mastering Engineer', 'Audio Engineer', 'Recording Engineer', 
    'DJ', 'Instrumentalist', 'Guitarist', 'Pianist', 'Drummer', 'Saxophonist', 'Violinist', 'Bassist', 
    'Composer', 'Choir Director', 'Music Director', 'Voice Coach', 'Voiceover Artist', 'Podcaster', 
    'Radio Host', 'Audio Storyteller', 'Spoken Word Artist', 'Music Arranger', 'Live Performer', 
    'Backup Vocalist', 'Sound Designer', 'Foley Artist', 'Audio Editor'
  ]},
  { id: 'Film, TV & Video', icon: Film, label: 'Film, TV & Video', subtitle: 'Directors, Editors, Cinematographers', specializations: [
    'Filmmaker', 'Director', 'Assistant Director', 'Cinematographer', 'Videographer', 'Video Editor', 
    'Colorist', 'Screenwriter', 'Scriptwriter', 'Documentary Filmmaker', 'Creative Director', 'Producer', 
    'Executive Producer', 'Production Manager', 'Camera Operator', 'Drone Operator', 'Film Editor', 
    'Motion Graphics Artist', 'Visual Effects Artist', 'Animator', '2D Animator', '3D Animator', 
    'Storyboard Artist', 'Set Designer', 'Lighting Technician', 'Production Assistant', 'Boom Operator', 
    'TV Presenter', 'Broadcaster', 'Streamer', 'YouTuber', 'Content Producer', 'Reel Creator', 'Short Film Creator'
  ]},
  { id: 'Photography & Visual Arts', icon: Camera, label: 'Photography & Visual Arts', subtitle: 'Photographers, Illustrators, Painters', specializations: [
    'Photographer', 'Portrait Photographer', 'Fashion Photographer', 'Event Photographer', 'Street Photographer', 
    'Documentary Photographer', 'Photojournalist', 'Retoucher', 'Photo Editor', 'Visual Artist', 'Digital Artist', 
    'Illustrator', 'Painter', 'Sketch Artist', 'Cartoonist', 'Comic Artist', 'Concept Artist', 'Mural Artist', 
    'Graffiti Artist', 'Collage Artist', 'Fine Artist', 'NFT Artist', 'Print Artist', 'Mixed Media Artist', 
    'Sculptor', 'Ceramic Artist', 'Installation Artist', 'Art Director', 'Gallery Curator'
  ]},
  { id: 'Writing & Content', icon: PenTool, label: 'Writing & Content', subtitle: 'Copywriters, Screenwriters, Authors', specializations: [
    'Writer', 'Author', 'Poet', 'Blogger', 'Journalist', 'Copywriter', 'Scriptwriter', 'Ghostwriter', 
    'Editor', 'Proofreader', 'Technical Writer', 'Creative Writer', 'Novelist', 'Essayist', 'Storyteller', 
    'Spoken Word Creator', 'Newsletter Writer', 'SEO Writer', 'Social Media Writer', 'Content Creator', 
    'UGC Creator', 'Influencer', 'Lifestyle Creator', 'Educational Creator', 'Tech Creator', 'Commentary Creator', 
    'Reviewer', 'Meme Creator'
  ]},
  { id: 'Acting & Performance', icon: Mic2, label: 'Acting & Performance', subtitle: 'Actors, Dancers, Voice Talent', specializations: [
    'Actor', 'Actress', 'Performer', 'Theatre Actor', 'Stage Performer', 'Voice Actor', 'Comedian', 
    'Skit Maker', 'MC', 'Event Host', 'Presenter', 'TV Personality', 'Live Entertainer', 'Dancer', 
    'Choreographer', 'Dance Instructor', 'Performance Artist', 'Circus Performer', 'Mime Artist', 
    'Puppeteer', 'Magician'
  ]},
  { id: 'Fashion & Beauty', icon: Scissors, label: 'Fashion & Beauty', subtitle: 'Designers, Stylists, MUAs', specializations: [
    'Fashion Designer', 'Stylist', 'Personal Stylist', 'Costume Designer', 'Wardrobe Stylist', 'Makeup Artist', 
    'Beauty Creator', 'Hair Stylist', 'Barber', 'Nail Artist', 'Fashion Illustrator', 'Model', 'Runway Model', 
    'Commercial Model', 'Fashion Content Creator', 'Jewelry Designer', 'Textile Designer', 'Fashion Photographer', 
    'Fashion Creative Director'
  ]},
  { id: 'Design & Creative Tech', icon: Palette, label: 'Design & Creative Tech', subtitle: 'UI/UX, 3D Artists, Animators', specializations: [
    'Graphic Designer', 'UI Designer', 'UX Designer', 'Product Designer', 'Web Designer', 'Brand Designer', 
    'Motion Designer', '3D Designer', 'Industrial Designer', 'Packaging Designer', 'Visual Designer', 
    'Typography Designer', 'Presentation Designer', 'Creative Technologist', 'AR Creator', 'VR Creator', 
    'Game Designer', 'Game Artist', 'Level Designer', 'Indie Game Developer'
  ]},
  { id: 'Digital & Social Creators', icon: Smartphone, label: 'Digital & Social Creators', subtitle: 'Streamers, Influencers, Vloggers', specializations: [
    'Social Media Creator', 'TikTok Creator', 'Instagram Creator', 'YouTube Creator', 'Twitch Streamer', 
    'Live Streamer', 'Gaming Creator', 'Reaction Creator', 'Vlogger', 'Lifestyle Influencer', 'Travel Creator', 
    'Food Creator', 'Fitness Creator', 'Educational Influencer', 'Motivational Speaker', 'Business Creator', 
    'Finance Creator', 'Comedy Creator'
  ]},
  { id: 'Event & Entertainment Industry', icon: Calendar, label: 'Event & Entertainment Industry', subtitle: 'Planners, Curators, Managers', specializations: [
    'Event Planner', 'Event Curator', 'Concert Organizer', 'Festival Organizer', 'Talent Manager', 'Artist Manager', 
    'Booking Agent', 'Talent Scout', 'Casting Director', 'Casting Scout', 'A&R Representative', 'Entertainment Executive', 
    'Creative Consultant', 'Brand Strategist', 'Community Manager', 'Publicist', 'PR Manager'
  ]},
  { id: 'Brand & Agency', icon: Briefcase, label: 'Brand & Agency Profiles', subtitle: 'Agencies, Studios, Labels', specializations: [
    'Brand', 'Agency', 'Creative Agency', 'Production House', 'Record Label', 'Media Company', 'Fashion Brand', 
    'Marketing Agency', 'Talent Agency', 'Creative Studio', 'Entertainment Company', 'Publishing Company', 
    'Film Studio', 'Startup', 'Nonprofit Organization'
  ]},
  { id: 'Education & Community', icon: BookOpen, label: 'Creative Education & Community', subtitle: 'Coaches, Mentors, Educators', specializations: [
    'Creative Coach', 'Mentor', 'Workshop Host', 'Creative Educator', 'Art Teacher', 'Music Teacher', 
    'Dance Instructor', 'Acting Coach', 'Community Builder', 'Creative Curator', 'Creative Recruiter', 
    'Industry Speaker', 'Creative Consultant'
  ]}
];

const Register = () => {
  // Steps: 1: Details, 2: Categories, 3: Specializations, 4: Summary
  const [step, setStep] = useState(1); 
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountDetails, setAccountDetails] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { register, checkAvailability } = useAuthStore();

  const handleCategoryToggle = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSpecializationToggle = (spec) => {
    setSelectedSpecializations(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await checkAvailability(accountDetails.username, accountDetails.email);
    if (result.success && result.available) {
      setStep(2);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async () => {
    setLoading(true);
    setError('');
    
    const payload = {
      ...accountDetails,
      profileType: selectedCategories.join(', '),
      specializations: selectedSpecializations.join(', ')
    };

    const result = await register(payload);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Derived state for step 3
  const availableSpecializations = CATEGORIES
    .filter(c => selectedCategories.includes(c.id))
    .flatMap(c => c.specializations)
    // Remove duplicates if any exist across categories
    .filter((value, index, self) => self.indexOf(value) === index);

  // Helper for step 4 UI
  const primaryCategory = selectedCategories.length > 0 ? CATEGORIES.find(c => c.id === selectedCategories[0]) : null;

  return (
    <div className="min-h-screen bg-[#0F131E] flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Left Marketing Section */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative z-10 min-h-[50vh] lg:min-h-screen">
        <Link to="/" className="flex items-center gap-3 mb-16 lg:mb-24 w-fit group">
          <div className="w-10 h-10 bg-[#7B5CFA] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#7B5CFA]/20 group-hover:bg-[#684CE0] transition-colors">M</div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Micollab</h1>
        </Link>
        
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="m-step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                  Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Identity.</span>
                </h2>
                <p className="text-[#8B95A5] text-lg lg:text-xl leading-relaxed mb-12 max-w-md font-medium">
                  Set up your account details to finalize your profile and enter the Micollab ecosystem.
                </p>
                
                <div className="flex items-center gap-4 bg-[#181D2A] w-fit p-4 pr-8 rounded-2xl border border-white/5 shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                    <Lock size={20} className="text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Secure Profile</p>
                    <p className="text-[#8B95A5] text-xs font-medium mt-0.5">Your data is safe with us</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="m-step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                  Define Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Craft.</span>
                </h2>
                <p className="text-[#8B95A5] text-lg lg:text-xl leading-relaxed mb-12 max-w-md font-medium">
                  Tell us what you do so we can tailor your multiverse experience and connect you with the right collaborators.
                </p>
                
                <div className="flex items-center gap-4 bg-[#181D2A] w-fit p-4 pr-8 rounded-2xl border border-white/5 shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-[#7B5CFA]/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-[#A37BFF]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Personalized Feed</p>
                    <p className="text-[#8B95A5] text-xs font-medium mt-0.5">Based on your selections</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="m-step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                  Refine Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Focus.</span>
                </h2>
                <p className="text-[#8B95A5] text-lg lg:text-xl leading-relaxed mb-12 max-w-md font-medium">
                  Dive deeper into your expertise. This helps us suggest the perfect projects, briefs, and creative circles for you.
                </p>
                
                <div className="flex flex-col gap-4 bg-[#181D2A] w-fit p-5 rounded-2xl border border-white/5 shadow-xl max-w-sm">
                  <div className="flex items-center gap-3">
                    <Target size={18} className="text-[#00B5D8]" />
                    <p className="text-white text-sm font-bold">Match Accuracy</p>
                  </div>
                  <div className="w-full h-1.5 bg-[#0F131E] rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-gradient-to-r from-[#7B5CFA] to-[#00B5D8] rounded-full" />
                  </div>
                  <p className="text-[#8B95A5] text-[11px] font-medium leading-relaxed">
                    Adding specific tags increases your visibility to the right collaborators.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="m-step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                  You're <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">All Set.</span>
                </h2>
                <p className="text-[#8B95A5] text-lg lg:text-xl leading-relaxed mb-12 max-w-md font-medium">
                  Your creative profile is primed. Get ready to connect, collaborate, and bring your visionary projects to life.
                </p>
                
                <div className="bg-[#181D2A] border border-white/5 rounded-2xl p-6 shadow-xl w-fit min-w-[300px]">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(accountDetails.username || 'User')}&background=7B5CFA&color=fff`} 
                      className="w-14 h-14 rounded-full border-2 border-[#181D2A] object-cover" 
                      alt="Avatar" 
                    />
                    <div>
                      <h3 className="text-white font-bold text-lg">{accountDetails.username || 'Creator'}</h3>
                      <p className="text-[#00B5D8] text-sm font-bold">{selectedSpecializations[0] || (primaryCategory ? primaryCategory.label : 'Creative')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecializations.slice(0, 3).map(spec => (
                      <div key={spec} className="px-2.5 py-1 bg-[#7B5CFA]/20 rounded text-[#A37BFF] text-[10px] font-bold">
                        {spec}
                      </div>
                    ))}
                    {selectedSpecializations.length > 3 && (
                      <div className="px-2.5 py-1 bg-white/5 rounded text-[#8B95A5] text-[10px] font-bold">
                        +{selectedSpecializations.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 lg:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-xl bg-[#181D2A] p-8 md:p-10 rounded-[2rem] border border-white/5 relative overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Top colored indicator line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7B5CFA] to-[#4D38A0]" />
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ACCOUNT DETAILS */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-8 text-xs font-bold text-[#8B95A5] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  </div>
                  <span>Step 1 of 4</span>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">Create your account</h2>
                  <p className="text-[#8B95A5] font-medium text-sm">Let's get started.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep1Submit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5]" size={18} />
                      <input 
                        type="text" 
                        required
                        value={accountDetails.username}
                        onChange={(e) => setAccountDetails({...accountDetails, username: e.target.value})}
                        placeholder="creative_soul"
                        className="w-full bg-[#0F131E] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#7B5CFA] transition font-medium placeholder-[#8B95A5]/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5]" size={18} />
                      <input 
                        type="email" 
                        required
                        value={accountDetails.email}
                        onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
                        placeholder="you@example.com"
                        className="w-full bg-[#0F131E] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#7B5CFA] transition font-medium placeholder-[#8B95A5]/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5]" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={accountDetails.password}
                        onChange={(e) => setAccountDetails({...accountDetails, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-[#0F131E] border border-white/5 rounded-xl py-3 pl-12 pr-12 text-white outline-none focus:border-[#7B5CFA] transition font-medium tracking-widest placeholder-[#8B95A5]/50"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A5] hover:text-white transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>Next Step <ChevronRight size={18} /></>
                    )}
                  </button>

                  <p className="pt-4 text-center text-[#8B95A5] text-xs font-bold">
                    Already have an account? {' '}
                    <Link to="/login" className="text-[#00B5D8] hover:text-white transition">Log in</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* STEP 2: CATEGORIES */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-8 text-xs font-bold text-[#8B95A5] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  </div>
                  <span>Step 2 of 4</span>
                </div>

                <button onClick={() => setStep(1)} className="text-xs font-bold text-[#A37BFF] hover:text-white transition mb-6 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">What describes you best?</h2>
                  <p className="text-[#8B95A5] font-medium text-sm">Select one or more broad categories.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
                  {CATEGORIES.map(category => {
                    const Icon = category.icon;
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                          isSelected 
                            ? 'border-[#7B5CFA] bg-[#7B5CFA]/10 shadow-[0_0_15px_rgba(123,92,250,0.15)]' 
                            : 'border-white/5 bg-[#181D2A] hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#7B5CFA]' : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                          <Icon size={18} className={isSelected ? 'text-white' : 'text-[#8B95A5] group-hover:text-white'} />
                        </div>
                        <div className="flex-1 pr-6">
                          <p className={`font-bold text-sm leading-tight mb-1 transition-colors ${
                            isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
                          }`}>
                            {category.label}
                          </p>
                          <p className="text-[#8B95A5] text-[10px] leading-snug">
                            {category.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#7B5CFA] rounded-full p-0.5">
                            <Check size={12} className="text-white" strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setStep(3)}
                  disabled={selectedCategories.length === 0}
                  className="w-full py-3.5 mt-4 bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-[#0F131E] disabled:text-[#8B95A5] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:shadow-none"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 3: SPECIALIZATIONS */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-8 text-xs font-bold text-[#8B95A5] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  </div>
                  <span>STEP 3 OF 4</span>
                </div>

                <button onClick={() => setStep(2)} className="text-xs font-bold text-[#A37BFF] hover:text-white transition mb-4 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>

                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedCategories.map(catId => {
                      const cat = CATEGORIES.find(c => c.id === catId);
                      const Icon = cat ? cat.icon : null;
                      if (!cat) return null;
                      return (
                        <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7B5CFA]/10 border border-[#7B5CFA]/30 rounded-full">
                          {Icon && <Icon size={12} className="text-[#A37BFF]" />}
                          <span className="text-[#A37BFF] text-[10px] font-bold tracking-wide">{cat.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">What's your specialty?</h2>
                  <p className="text-[#8B95A5] font-medium text-sm">Select tags that define your specific skills within your chosen categories.</p>
                </div>

                <div className="relative mb-6">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5]" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills (e.g., Mixing, Beatmaking)..."
                    className="w-full bg-[#181D2A] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#7B5CFA]/50 transition font-medium placeholder-[#8B95A5] text-sm"
                  />
                </div>

                <div className="max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                   {availableSpecializations.length === 0 ? (
                     <p className="py-8 text-center text-[#8B95A5] text-sm font-bold">Please go back and select a category.</p>
                   ) : (
                     <div className="flex flex-wrap gap-2.5 pb-4">
                       {availableSpecializations.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).map(spec => {
                          const isSelected = selectedSpecializations.includes(spec);
                          return (
                            <button
                              key={spec}
                              onClick={() => handleSpecializationToggle(spec)}
                              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                isSelected 
                                  ? 'bg-[#7B5CFA]/10 text-white border-[#7B5CFA] shadow-[0_0_10px_rgba(123,92,250,0.15)]' 
                                  : 'bg-[#181D2A] text-[#8B95A5] border-white/5 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {spec}
                            </button>
                          )
                       })}
                     </div>
                   )}
                </div>

                <button 
                  onClick={() => setStep(4)}
                  disabled={selectedSpecializations.length === 0}
                  className="w-full py-3.5 mt-4 bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-[#0F131E] disabled:text-[#8B95A5] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:shadow-none"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 4: SUMMARY & SUBMIT */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-8 text-xs font-bold text-[#8B95A5] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                  </div>
                  <span>STEP 4 OF 4</span>
                </div>

                <button onClick={() => setStep(3)} className="text-xs font-bold text-[#A37BFF] hover:text-white transition mb-6 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="text-center mb-8 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#7B5CFA] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(123,92,250,0.4)]">
                    <Rocket size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 leading-tight">Welcome to the Future<br/>of Collaboration</h2>
                  <p className="text-[#8B95A5] font-medium text-sm">Your workspace is ready. Discover briefs, connect with peers, and start creating.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-[#181D2A] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <Layers size={16} className="text-[#00B5D8] mb-2" />
                    <p className="text-white text-xs font-bold mb-0.5">Category</p>
                    <p className="text-[#8B95A5] text-[10px] truncate">{primaryCategory ? primaryCategory.label : 'None'}</p>
                  </div>
                  <div className="bg-[#181D2A] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <Tag size={16} className="text-[#A37BFF] mb-2" />
                    <p className="text-white text-xs font-bold mb-0.5">Specialties</p>
                    <p className="text-[#8B95A5] text-[10px] truncate">{selectedSpecializations.slice(0,3).join(', ')}</p>
                  </div>
                  <div className="bg-[#181D2A] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <User size={16} className="text-[#EC4899] mb-2" />
                    <p className="text-white text-xs font-bold mb-0.5">Role</p>
                    <p className="text-[#8B95A5] text-[10px] truncate">{selectedSpecializations[0] || 'Creator'}</p>
                  </div>
                  <div className="bg-[#181D2A] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <Handshake size={16} className="text-[#10B981] mb-2" />
                    <p className="text-white text-xs font-bold mb-0.5">Open To</p>
                    <p className="text-[#8B95A5] text-[10px] truncate">Remote Collabs</p>
                  </div>
                </div>

                <button 
                  onClick={handleRegisterSubmit}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#7B5CFA] to-[#684CE0] hover:to-[#5c40d1] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(123,92,250,0.4)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Enter Micollab <ArrowRight size={18} /></>
                  )}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
