import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Loader2, AlertCircle, ChevronRight, ChevronLeft, Check, 
  Music, Film, Camera, PenTool, Mic2, Scissors, Palette, Smartphone, 
  Calendar, Briefcase, BookOpen, ArrowLeft, Eye, EyeOff, Sparkles, Target, Search,
  Layers, Tag, Handshake, Rocket, ArrowRight, Upload, Image as ImageIcon
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
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
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  
  // Profile Image State
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  // OTP State
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { register, checkAvailability, verifyOTP, resendOTP, loginWithGoogle, updateProfile } = useAuthStore();

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [googleCredential, setGoogleCredential] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isGoogleOnboarding, setIsGoogleOnboarding] = useState(false);

  React.useEffect(() => {
    if (location.state?.requireUsername && location.state?.googleCredential) {
      setGoogleCredential(location.state.googleCredential);
      setNewUsername(location.state.suggestedName || '');
      setShowUsernameModal(true);
      
      // Clean up state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title);
    } else if (location.state?.resumeOnboarding) {
      setIsGoogleOnboarding(true);
      setAccountDetails(prev => ({ ...prev, username: location.state.username }));
      setStep(2);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
    setUsernameSuggestions([]);
    
    const availResult = await checkAvailability(accountDetails.username, accountDetails.email);
    if (!availResult.success || !availResult.available) {
      setError(availResult.error);
      if (availResult.suggestions && availResult.suggestions.length > 0) {
        setUsernameSuggestions(availResult.suggestions);
      }
      setLoading(false);
      return;
    }

    const payload = { ...accountDetails };
    const result = await register(payload);
    
    if (result.success && result.requiresOTP) {
      setRequiresVerification(true);
    } else if (result.success) {
      setIsGoogleOnboarding(true);
      setStep(2);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async () => {
    // Just move to step 5. We will save everything at the end to prevent the router
    // from redirecting us to '/' prematurely since 'isOnboarded' depends on user.skills.
    setStep(5);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFinishOnboarding = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    let uploadedImageUrl = null;

    if (profileImageFile) {
      try {
        const formData = new FormData();
        formData.append('media', profileImageFile);
        
        const uploadRes = await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.urls && uploadRes.data.urls.length > 0) {
          uploadedImageUrl = uploadRes.data.urls[0];
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    } else {
      // Assign a default avatar using their username
      uploadedImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(accountDetails.username || 'User')}&background=random&color=fff&size=256`;
    }

    await updateProfile({ 
      profileType: selectedCategories.join(', '),
      skills: selectedSpecializations.join(', '),
      profileImage: uploadedImageUrl 
    });
    
    setLoading(false);
    navigate('/');
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await verifyOTP(accountDetails.email, otpCode);
    if (result.success) {
      setRequiresVerification(false);
      setIsGoogleOnboarding(true); // Flags that we are now authenticated and just updating profile
      setStep(2);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const result = await resendOTP(accountDetails.email);
    if (!result.success) {
      setError(result.error);
    } else {
      setError('Verification code resent successfully.');
    }
    setLoading(false);
  };

  // Removed duplicate state declarations

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    
    if (result.success) {
      if (!result.user?.skills) {
        setIsGoogleOnboarding(true);
        setAccountDetails(prev => ({ ...prev, username: result.user.username }));
        setStep(2);
      } else {
        navigate('/');
      }
    } else if (result.requireUsername) {
      setGoogleCredential(credentialResponse.credential);
      setShowUsernameModal(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleUsernameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await loginWithGoogle(googleCredential, newUsername);
    if (result.success) {
      // Don't navigate — enter onboarding flow instead
      setShowUsernameModal(false);
      setIsGoogleOnboarding(true);
      setAccountDetails({ ...accountDetails, username: newUsername });
      setStep(2);
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
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Left Marketing Section */}
      <div className="hidden lg:flex w-[55%] flex-col justify-center p-12 relative z-10 min-h-screen">
        <Link to="/" className="flex items-center gap-3 mb-6 lg:mb-6 w-fit group">
          <div className="w-10 h-10 bg-[#7B5CFA] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#7B5CFA]/20 group-hover:bg-[#684CE0] transition-colors">M</div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Micollab</h1>
        </Link>
        
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="m-step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 leading-[1.1] tracking-tight">
                  Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Identity.</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg lg:text-xl leading-relaxed mb-6 max-w-md font-medium">
                  Set up your account details to finalize your profile and enter the Micollab ecosystem.
                </p>
                
                <div className="flex items-center gap-4 bg-[var(--bg-surface-alt)] w-fit p-4 pr-8 rounded-2xl border border-[var(--border-primary)] shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                    <Lock size={20} className="text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] text-sm font-bold">Secure Profile</p>
                    <p className="text-[var(--text-secondary)] text-xs font-medium mt-0.5">Your data is safe with us</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="m-step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 leading-[1.1] tracking-tight">
                  Define Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Craft.</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg lg:text-xl leading-relaxed mb-6 max-w-md font-medium">
                  Tell us what you do so we can tailor your multiverse experience and connect you with the right collaborators.
                </p>
                
                <div className="flex items-center gap-4 bg-[var(--bg-surface-alt)] w-fit p-4 pr-8 rounded-2xl border border-[var(--border-primary)] shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-[#7B5CFA]/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-[#A37BFF]" />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] text-sm font-bold">Personalized Feed</p>
                    <p className="text-[var(--text-secondary)] text-xs font-medium mt-0.5">Based on your selections</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="m-step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 leading-[1.1] tracking-tight">
                  Refine Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">Focus.</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg lg:text-xl leading-relaxed mb-6 max-w-md font-medium">
                  Dive deeper into your expertise. This helps us suggest the perfect projects, briefs, and creative circles for you.
                </p>
                
                <div className="flex flex-col gap-4 bg-[var(--bg-surface-alt)] w-fit p-5 rounded-2xl border border-[var(--border-primary)] shadow-xl max-w-sm">
                  <div className="flex items-center gap-3">
                    <Target size={18} className="text-[#00B5D8]" />
                    <p className="text-[var(--text-primary)] text-sm font-bold">Match Accuracy</p>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-base)] rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-gradient-to-r from-[#7B5CFA] to-[#00B5D8] rounded-full" />
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] font-medium leading-relaxed">
                    Adding specific tags increases your visibility to the right collaborators.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="m-step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] mb-6 leading-[1.1] tracking-tight">
                  You're <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D0B3FF] to-[#A37BFF]">All Set.</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg lg:text-xl leading-relaxed mb-6 max-w-md font-medium">
                  Your creative profile is primed. Get ready to connect, collaborate, and bring your visionary projects to life.
                </p>
                
                <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-xl w-fit min-w-[300px]">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(accountDetails.username || 'User')}&background=7B5CFA&color=fff`} 
                      className="w-14 h-14 rounded-full border-2 border-[#181D2A] object-cover" 
                      alt="Avatar" 
                    />
                    <div>
                      <h3 className="text-[var(--text-primary)] font-bold text-lg">{accountDetails.username || 'Creator'}</h3>
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
                      <div className="px-2.5 py-1 bg-white/5 rounded text-[var(--text-secondary)] text-[10px] font-bold">
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
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-4 lg:p-12 relative z-10 min-h-screen lg:min-h-0">
        
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8 w-fit group">
          <div className="w-10 h-10 bg-[#7B5CFA] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#7B5CFA]/20">M</div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Micollab</h1>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-xl bg-[var(--bg-surface-alt)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-primary)] relative overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Top colored indicator line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7B5CFA] to-[#4D38A0]" />
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ACCOUNT DETAILS */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-6 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  </div>
                  <span>Step 1 of 4</span>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Create your account</h2>
                  <p className="text-[var(--text-secondary)] font-medium text-sm">Let's get started.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)] ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                      <input 
                        type="text" 
                        required
                        value={accountDetails.username}
                        onChange={(e) => setAccountDetails({...accountDetails, username: e.target.value})}
                        placeholder="creative_soul"
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-2.5 pl-12 pr-4 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-medium placeholder-[#8B95A5]/50"
                      />
                    </div>
                    {usernameSuggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 ml-1">Try one of these instead:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {usernameSuggestions.map(suggestion => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                setAccountDetails({...accountDetails, username: suggestion});
                                setUsernameSuggestions([]);
                                setError('');
                              }}
                              className="px-3 py-1 bg-[#7B5CFA]/10 border border-[#7B5CFA]/20 rounded-lg text-[#A37BFF] text-xs font-bold hover:bg-[#7B5CFA]/20 hover:border-[#7B5CFA]/40 transition-all cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)] ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                      <input 
                        type="email" 
                        required
                        value={accountDetails.email}
                        onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
                        placeholder="you@example.com"
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-2.5 pl-12 pr-4 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-medium placeholder-[#8B95A5]/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)] ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={accountDetails.password}
                        onChange={(e) => setAccountDetails({...accountDetails, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-2.5 pl-12 pr-12 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-medium tracking-widest placeholder-[#8B95A5]/50"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>Next Step <ChevronRight size={18} /></>
                    )}
                  </button>

                  <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-white/5 flex-1" />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Or continue with</span>
                    <div className="h-px bg-white/5 flex-1" />
                  </div>

                  <div className="flex flex-col items-center justify-center w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google sign-up failed')}
                      theme="filled_black"
                      shape="pill"
                      width="100%"
                      text="continue_with"
                    />
                  </div>

                  <p className="pt-4 text-center text-[var(--text-secondary)] text-xs font-bold">
                    Already have an account? {' '}
                    <Link to="/login" className="text-[#00B5D8] hover:text-[var(--text-primary)] transition">Log in</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* STEP 2: CATEGORIES */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-6 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  </div>
                  <span>Step 2 of 4</span>
                </div>

                <button onClick={() => setStep(1)} className="text-xs font-bold text-[#A37BFF] hover:text-[var(--text-primary)] transition mb-6 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">What describes you best?</h2>
                  <p className="text-[var(--text-secondary)] font-medium text-sm">Select one or more broad categories.</p>
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
                            : 'border-[var(--border-primary)] bg-[var(--bg-surface-alt)] hover:border-[var(--border-secondary)] hover:bg-white/5'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#7B5CFA]' : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                          <Icon size={18} className={isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'} />
                        </div>
                        <div className="flex-1 pr-6">
                          <p className={`font-bold text-sm leading-tight mb-1 transition-colors ${
                            isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]/90 group-hover:text-[var(--text-primary)]'
                          }`}>
                            {category.label}
                          </p>
                          <p className="text-[var(--text-secondary)] text-[10px] leading-snug">
                            {category.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#7B5CFA] rounded-full p-0.5">
                            <Check size={12} className="text-[var(--text-primary)]" strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setStep(3)}
                  disabled={selectedCategories.length === 0}
                  className="w-full py-2.5 mt-4 bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-[var(--bg-base)] disabled:text-[var(--text-secondary)] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:shadow-none"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 3: SPECIALIZATIONS */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-6 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  </div>
                  <span>STEP 3 OF 4</span>
                </div>

                <button onClick={() => setStep(2)} className="text-xs font-bold text-[#A37BFF] hover:text-[var(--text-primary)] transition mb-4 flex items-center gap-1">
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
                  <h2 className="text-2xl lg:text-2xl font-black text-[var(--text-primary)] mb-2">What's your specialty?</h2>
                  <p className="text-[var(--text-secondary)] font-medium text-sm">Select tags that define your specific skills within your chosen categories.</p>
                </div>

                <div className="relative mb-6">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills (e.g., Mixing, Beatmaking)..."
                    className="w-full bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-xl py-2.5 pl-10 pr-4 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA]/50 transition font-medium placeholder-[#8B95A5] text-sm"
                  />
                </div>

                <div className="max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                   {availableSpecializations.length === 0 ? (
                     <p className="py-8 text-center text-[var(--text-secondary)] text-sm font-bold">Please go back and select a category.</p>
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
                                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-white/20 hover:text-[var(--text-primary)]'
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
                  className="w-full py-2.5 mt-4 bg-[#7B5CFA] hover:bg-[#684CE0] disabled:bg-[var(--bg-base)] disabled:text-[var(--text-secondary)] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(123,92,250,0.3)] disabled:shadow-none"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 4: SUMMARY & SUBMIT */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-6 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                  </div>
                  <span>STEP 4 OF 4</span>
                </div>

                <button onClick={() => setStep(3)} className="text-xs font-bold text-[#A37BFF] hover:text-[var(--text-primary)] transition mb-6 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="text-center mb-6 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#7B5CFA] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(123,92,250,0.4)]">
                    <Rocket size={32} className="text-[var(--text-primary)]" />
                  </div>
                  <h2 className="text-2xl lg:text-2xl font-black text-[var(--text-primary)] mb-2 leading-tight">Welcome to the Future<br/>of Collaboration</h2>
                  <p className="text-[var(--text-secondary)] font-medium text-sm">Your workspace is ready. Discover briefs, connect with peers, and start creating.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl p-4 hover:border-[var(--border-secondary)] transition-colors">
                    <Layers size={16} className="text-[#00B5D8] mb-2" />
                    <p className="text-[var(--text-primary)] text-xs font-bold mb-0.5">Category</p>
                    <p className="text-[var(--text-secondary)] text-[10px] truncate">{primaryCategory ? primaryCategory.label : 'None'}</p>
                  </div>
                  <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl p-4 hover:border-[var(--border-secondary)] transition-colors">
                    <Tag size={16} className="text-[#A37BFF] mb-2" />
                    <p className="text-[var(--text-primary)] text-xs font-bold mb-0.5">Specialties</p>
                    <p className="text-[var(--text-secondary)] text-[10px] truncate">{selectedSpecializations.slice(0,3).join(', ')}</p>
                  </div>

                  <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl p-4 hover:border-[var(--border-secondary)] transition-colors">
                    <User size={16} className="text-[#EC4899] mb-2" />
                    <p className="text-[var(--text-primary)] text-xs font-bold mb-0.5">Role</p>
                    <p className="text-[var(--text-secondary)] text-[10px] truncate">{selectedSpecializations[0] || 'Creator'}</p>
                  </div>
                  <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-primary)] rounded-2xl p-4 hover:border-[var(--border-secondary)] transition-colors">
                    <Handshake size={16} className="text-[#10B981] mb-2" />
                    <p className="text-[var(--text-primary)] text-xs font-bold mb-0.5">Open To</p>
                    <p className="text-[var(--text-secondary)] text-[10px] truncate">Remote Collabs</p>
                  </div>
                </div>

                <button 
                  onClick={handleRegisterSubmit}
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#7B5CFA] to-[#684CE0] hover:to-[#5c40d1] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(123,92,250,0.4)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Complete Profile <ArrowRight size={18} /></>
                  )}
                </button>
              </motion.div>
            )}

            {/* STEP 5: PROFILE PICTURE */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex items-center justify-between mb-6 text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                    <div className="w-6 h-1.5 bg-[#7B5CFA] rounded-full shadow-[0_0_8px_rgba(123,92,250,0.5)]" />
                  </div>
                  <span>STEP 5 OF 5</span>
                </div>

                <div className="text-center mb-8 flex flex-col items-center">
                  <h2 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-2 leading-tight">Put a face to the name</h2>
                  <p className="text-[var(--text-secondary)] font-medium text-sm max-w-sm">
                    Upload a profile picture so collaborators can recognize you.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="relative group">
                    <div className={`w-32 h-32 rounded-full border-2 border-dashed ${profileImagePreview ? 'border-[#7B5CFA]' : 'border-[var(--border-primary)]'} flex items-center justify-center overflow-hidden bg-[var(--bg-surface-alt)] relative transition-all`}>
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-[var(--text-secondary)]" />
                      )}
                      
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                        <Upload size={20} className="text-white mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                  {profileImageFile && (
                    <button 
                      onClick={() => { setProfileImageFile(null); setProfileImagePreview(null); }}
                      className="mt-4 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <button 
                  onClick={handleFinishOnboarding}
                  disabled={loading}
                  className="w-full py-3 bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(123,92,250,0.4)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    profileImageFile ? 'Upload & Enter Micollab' : 'Enter Micollab'
                  )}
                </button>

                {!profileImageFile && (
                  <button 
                    onClick={handleFinishOnboarding}
                    disabled={loading}
                    className="w-full mt-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>

      {/* OTP Verification Modal */}
      {requiresVerification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[var(--bg-surface-alt)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-2xl relative"
          >
            <div className="w-12 h-12 bg-[#7B5CFA]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-[#7B5CFA]" size={24} />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] text-center mb-2">Check your email</h3>
            <p className="text-[var(--text-secondary)] text-sm text-center mb-6">
              We've sent a verification code to <strong className="text-[var(--text-primary)]">{accountDetails.email}</strong>.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-4 px-4 text-center text-2xl tracking-[0.5em] text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-black"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-black rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[var(--text-secondary)] text-xs font-medium">
                Didn't receive the code?{' '}
                <button type="button" onClick={async (e) => {
                  e.preventDefault();
                  const res = await resendOTP(accountDetails.email);
                  if(!res.success) setError(res.error);
                  else alert("Code resent!");
                }} className="text-[#7B5CFA] hover:underline font-bold">
                  Resend it
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Username Picker Modal for New Google Users */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[var(--bg-surface-alt)] p-8 rounded-3xl border border-[var(--border-primary)] shadow-2xl relative"
          >
            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Pick a Username</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              You're almost in! Choose a unique username for your Micollab profile.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleGoogleUsernameSubmit} className="space-y-4">
              <input 
                type="text" 
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="creative_genius"
                className="w-full bg-[var(--bg-base)] border border-[var(--border-primary)] rounded-xl py-2.5 px-4 text-[var(--text-primary)] outline-none focus:border-[#7B5CFA] transition font-medium"
              />
              <button 
                type="submit"
                disabled={loading || !newUsername}
                className="w-full py-2.5 bg-[#7B5CFA] hover:bg-[#684CE0] text-white font-black rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Sign Up'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowUsernameModal(false);
                  setGoogleCredential('');
                  setNewUsername('');
                }}
                className="w-full py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default Register;
