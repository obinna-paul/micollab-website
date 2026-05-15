import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Loader2, AlertCircle, ChevronRight, Check, 
  Music, Film, Camera, PenTool, Mic2, Scissors, Palette, Smartphone, 
  Calendar, Briefcase, BookOpen, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

// Exhaustive Categories Data
const CATEGORIES = [
  { id: 'Music & Audio', icon: Music, label: 'Music & Audio', specializations: [
    'Musician', 'Artist', 'Singer', 'Vocalist', 'Rapper', 'Songwriter', 'Music Producer', 'Beat Producer', 
    'Sound Engineer', 'Mixing Engineer', 'Mastering Engineer', 'Audio Engineer', 'Recording Engineer', 
    'DJ', 'Instrumentalist', 'Guitarist', 'Pianist', 'Drummer', 'Saxophonist', 'Violinist', 'Bassist', 
    'Composer', 'Choir Director', 'Music Director', 'Voice Coach', 'Voiceover Artist', 'Podcaster', 
    'Radio Host', 'Audio Storyteller', 'Spoken Word Artist', 'Music Arranger', 'Live Performer', 
    'Backup Vocalist', 'Sound Designer', 'Foley Artist', 'Audio Editor'
  ]},
  { id: 'Film, TV & Video', icon: Film, label: 'Film, TV & Video', specializations: [
    'Filmmaker', 'Director', 'Assistant Director', 'Cinematographer', 'Videographer', 'Video Editor', 
    'Colorist', 'Screenwriter', 'Scriptwriter', 'Documentary Filmmaker', 'Creative Director', 'Producer', 
    'Executive Producer', 'Production Manager', 'Camera Operator', 'Drone Operator', 'Film Editor', 
    'Motion Graphics Artist', 'Visual Effects Artist', 'Animator', '2D Animator', '3D Animator', 
    'Storyboard Artist', 'Set Designer', 'Lighting Technician', 'Production Assistant', 'Boom Operator', 
    'TV Presenter', 'Broadcaster', 'Streamer', 'YouTuber', 'Content Producer', 'Reel Creator', 'Short Film Creator'
  ]},
  { id: 'Photography & Visual Arts', icon: Camera, label: 'Photography & Visual Arts', specializations: [
    'Photographer', 'Portrait Photographer', 'Fashion Photographer', 'Event Photographer', 'Street Photographer', 
    'Documentary Photographer', 'Photojournalist', 'Retoucher', 'Photo Editor', 'Visual Artist', 'Digital Artist', 
    'Illustrator', 'Painter', 'Sketch Artist', 'Cartoonist', 'Comic Artist', 'Concept Artist', 'Mural Artist', 
    'Graffiti Artist', 'Collage Artist', 'Fine Artist', 'NFT Artist', 'Print Artist', 'Mixed Media Artist', 
    'Sculptor', 'Ceramic Artist', 'Installation Artist', 'Art Director', 'Gallery Curator'
  ]},
  { id: 'Writing & Content', icon: PenTool, label: 'Writing & Content', specializations: [
    'Writer', 'Author', 'Poet', 'Blogger', 'Journalist', 'Copywriter', 'Scriptwriter', 'Ghostwriter', 
    'Editor', 'Proofreader', 'Technical Writer', 'Creative Writer', 'Novelist', 'Essayist', 'Storyteller', 
    'Spoken Word Creator', 'Newsletter Writer', 'SEO Writer', 'Social Media Writer', 'Content Creator', 
    'UGC Creator', 'Influencer', 'Lifestyle Creator', 'Educational Creator', 'Tech Creator', 'Commentary Creator', 
    'Reviewer', 'Meme Creator'
  ]},
  { id: 'Acting & Performance', icon: Mic2, label: 'Acting & Performance', specializations: [
    'Actor', 'Actress', 'Performer', 'Theatre Actor', 'Stage Performer', 'Voice Actor', 'Comedian', 
    'Skit Maker', 'MC', 'Event Host', 'Presenter', 'TV Personality', 'Live Entertainer', 'Dancer', 
    'Choreographer', 'Dance Instructor', 'Performance Artist', 'Circus Performer', 'Mime Artist', 
    'Puppeteer', 'Magician'
  ]},
  { id: 'Fashion & Beauty', icon: Scissors, label: 'Fashion & Beauty', specializations: [
    'Fashion Designer', 'Stylist', 'Personal Stylist', 'Costume Designer', 'Wardrobe Stylist', 'Makeup Artist', 
    'Beauty Creator', 'Hair Stylist', 'Barber', 'Nail Artist', 'Fashion Illustrator', 'Model', 'Runway Model', 
    'Commercial Model', 'Fashion Content Creator', 'Jewelry Designer', 'Textile Designer', 'Fashion Photographer', 
    'Fashion Creative Director'
  ]},
  { id: 'Design & Creative Tech', icon: Palette, label: 'Design & Creative Tech', specializations: [
    'Graphic Designer', 'UI Designer', 'UX Designer', 'Product Designer', 'Web Designer', 'Brand Designer', 
    'Motion Designer', '3D Designer', 'Industrial Designer', 'Packaging Designer', 'Visual Designer', 
    'Typography Designer', 'Presentation Designer', 'Creative Technologist', 'AR Creator', 'VR Creator', 
    'Game Designer', 'Game Artist', 'Level Designer', 'Indie Game Developer'
  ]},
  { id: 'Digital & Social Creators', icon: Smartphone, label: 'Digital & Social Creators', specializations: [
    'Social Media Creator', 'TikTok Creator', 'Instagram Creator', 'YouTube Creator', 'Twitch Streamer', 
    'Live Streamer', 'Gaming Creator', 'Reaction Creator', 'Vlogger', 'Lifestyle Influencer', 'Travel Creator', 
    'Food Creator', 'Fitness Creator', 'Educational Influencer', 'Motivational Speaker', 'Business Creator', 
    'Finance Creator', 'Comedy Creator'
  ]},
  { id: 'Event & Entertainment Industry', icon: Calendar, label: 'Event & Entertainment Industry', specializations: [
    'Event Planner', 'Event Curator', 'Concert Organizer', 'Festival Organizer', 'Talent Manager', 'Artist Manager', 
    'Booking Agent', 'Talent Scout', 'Casting Director', 'Casting Scout', 'A&R Representative', 'Entertainment Executive', 
    'Creative Consultant', 'Brand Strategist', 'Community Manager', 'Publicist', 'PR Manager'
  ]},
  { id: 'Brand & Agency', icon: Briefcase, label: 'Brand & Agency Profiles', specializations: [
    'Brand', 'Agency', 'Creative Agency', 'Production House', 'Record Label', 'Media Company', 'Fashion Brand', 
    'Marketing Agency', 'Talent Agency', 'Creative Studio', 'Entertainment Company', 'Publishing Company', 
    'Film Studio', 'Startup', 'Nonprofit Organization'
  ]},
  { id: 'Education & Community', icon: BookOpen, label: 'Creative Education & Community', specializations: [
    'Creative Coach', 'Mentor', 'Workshop Host', 'Creative Educator', 'Art Teacher', 'Music Teacher', 
    'Dance Instructor', 'Acting Coach', 'Community Builder', 'Creative Curator', 'Creative Recruiter', 
    'Industry Speaker', 'Creative Consultant'
  ]}
];

const Register = () => {
  // Steps: 1: Categories, 2: Specializations, 3: Details, 4: OTP Verification
  const [step, setStep] = useState(1); 
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [accountDetails, setAccountDetails] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { register } = useAuthStore();

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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
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



  // Derived state for step 2
  const availableSpecializations = CATEGORIES
    .filter(c => selectedCategories.includes(c.id))
    .flatMap(c => c.specializations)
    // Remove duplicates if any exist across categories
    .filter((value, index, self) => self.indexOf(value) === index);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-black text-white text-xl">M</div>
        <h1 className="text-2xl font-black text-primary tracking-tighter">Micollab</h1>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-surface p-8 rounded-2xl border border-divider shadow-xl"
      >
        <AnimatePresence mode="wait">
          
          {/* STEP 1: CATEGORIES */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-textMain mb-2">What describes you best?</h2>
                <p className="text-textMuted">Select one or more broad categories.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {CATEGORIES.map(category => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-divider hover:border-primary/50 text-textMain'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} strokeWidth={isSelected ? 3 : 2} />
                        <span className="font-bold text-sm leading-tight">{category.label}</span>
                      </div>
                      {isSelected && <Check size={18} className="text-primary" />}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={selectedCategories.length === 0}
                className="w-full py-3 mt-6 bg-primary hover:bg-primaryHover disabled:bg-divider disabled:text-textMuted text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Next Step <ChevronRight size={18} />
              </button>
              
              <p className="text-center text-sm text-textMuted pt-4">
                Already on Micollab? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* STEP 2: SPECIALIZATIONS */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button onClick={() => setStep(1)} className="text-xs font-bold text-primary hover:underline mb-6 flex items-center gap-1">
                <ArrowLeft size={14} /> Back to categories
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-textMain mb-2">Select your specializations</h2>
                <p className="text-textMuted text-sm">Choose specific roles to help us tailor your experience.</p>
              </div>

              <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar border border-divider rounded-xl p-2 bg-gray-50">
                 {availableSpecializations.length === 0 ? (
                   <p className="p-4 text-center text-textMuted text-sm">Please go back and select a category.</p>
                 ) : (
                   <div className="flex flex-wrap gap-2 p-2">
                     {availableSpecializations.map(spec => {
                        const isSelected = selectedSpecializations.includes(spec);
                        return (
                          <button
                            key={spec}
                            onClick={() => handleSpecializationToggle(spec)}
                            className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                              isSelected 
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                                : 'bg-white text-textMuted border-divider hover:border-primary/50 hover:text-primary'
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
                onClick={() => setStep(3)}
                disabled={selectedSpecializations.length === 0}
                className="w-full py-3 mt-6 bg-primary hover:bg-primaryHover disabled:bg-divider disabled:text-textMuted text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Next Step <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* STEP 3: ACCOUNT DETAILS */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button onClick={() => setStep(2)} className="text-xs font-bold text-primary hover:underline mb-6 flex items-center gap-1">
                <ArrowLeft size={14} /> Back to specializations
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-textMain mb-2">Create your account</h2>
                <p className="text-textMuted text-sm">You're almost there.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMuted ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input 
                      type="text" 
                      required
                      value={accountDetails.username}
                      onChange={(e) => setAccountDetails({...accountDetails, username: e.target.value})}
                      placeholder="creative_soul"
                      className="w-full bg-background border border-divider rounded-xl py-2.5 pl-10 pr-4 text-textMain outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMuted ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input 
                      type="email" 
                      required
                      value={accountDetails.email}
                      onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
                      placeholder="you@example.com"
                      className="w-full bg-background border border-divider rounded-xl py-2.5 pl-10 pr-4 text-textMain outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-textMuted ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={accountDetails.password}
                      onChange={(e) => setAccountDetails({...accountDetails, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-background border border-divider rounded-xl py-2.5 pl-10 pr-12 text-textMain outline-none focus:border-primary transition"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-primary/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                </button>

                <p className="pt-2 text-center text-textMuted text-xs font-medium">
                  Already have an account? {' '}
                  <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
                </p>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
