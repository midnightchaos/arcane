import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { 
  User, Shield, Bell, Moon, Sun, Save, LogOut, 
  Trash2, AlertTriangle, Check, X, Camera, Lock,
  ChevronRight, Globe, Fingerprint
} from 'lucide-react';
import { authService } from '@/services/authService';

export default function Settings() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(user?.theme_preference || 'dark');
  
  // Apply theme live preview
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
  
  // Predefined cool avatars
  const AVATAR_PRESETS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Nico',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Lilly',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Oliver'
  ];
  
  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [notifications, setNotifications] = useState(user?.notifications_enabled ?? true);
  const [privacy, setPrivacy] = useState(user?.privacy_level || 'private');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarUrl(user.avatar_url || '');
      setTheme(user.theme_preference);
      setNotifications(user.notifications_enabled);
      setPrivacy(user.privacy_level);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // In a real app, this would call an API
      // For now, we simulate or call a patch endpoint if it exists
      const updatedUser = await authService.updateProfile({
        username,
        avatar_url: avatarUrl,
        theme_preference: theme,
        notifications_enabled: notifications,
        privacy_level: privacy
      });
      updateUser(updatedUser);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.deleteAccount(deletePassword);
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Account deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <Bell size={16} /> },
    { id: 'privacy', label: 'Privacy', icon: <Globe size={16} /> },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/50 text-sm">Manage your account and preferences</p>
        </div>
        <button 
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.05)]' 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 blur-[100px] rounded-full" />
          
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <Check size={16} /> {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : username.charAt(0).toUpperCase()}
                    </div>
                    <button 
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-black border border-white/10 text-white hover:text-pink-400 transition-all hover:scale-110 shadow-lg"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{username}</h3>
                    <p className="text-white/30 text-xs font-mono">{user?.email}</p>
                  </div>
                </div>

                {showAvatarPicker && (
                  <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl animate-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-white">Choose an Avatar</h4>
                      <button onClick={() => setShowAvatarPicker(false)} className="text-white/20 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {AVATAR_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          onClick={() => { setAvatarUrl(preset); setShowAvatarPicker(false); }}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${avatarUrl === preset ? 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Avatar URL</label>
                    <button onClick={() => setAvatarUrl('')} className="text-[10px] text-pink-400/60 hover:text-pink-400 transition-colors uppercase font-bold tracking-wider">Clear</button>
                  </div>
                  <input 
                    type="text" 
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all font-mono"
                  />
                </div>
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-pink-500 rounded-2xl text-sm font-bold text-white shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Save size={18} /> Update Profile
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Password Security</h4>
                  <p className="text-[11px] text-white/30">Last changed 3 months ago</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Current Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                    />
                    <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Confirm Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-pink-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Lock size={18} /> Update Password
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Appearance</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    <Moon size={20} />
                    <span className="text-[10px] font-bold">Deep Space</span>
                  </button>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    <Sun size={20} />
                    <span className="text-[10px] font-bold">Clean Light</span>
                  </button>
                  <button 
                    onClick={() => setTheme('pinkish')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${theme === 'pinkish' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    <Camera size={20} />
                    <span className="text-[10px] font-bold">Cyber Pink</span>
                  </button>
                  <button 
                    onClick={() => setTheme('minimal')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${theme === 'minimal' ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    <Shield size={20} />
                    <span className="text-[10px] font-bold">Stealth</span>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-white/40" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Push Notifications</h4>
                      <p className="text-[11px] text-white/30">Get alerted for workflow completions</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full relative transition-all ${notifications ? 'bg-pink-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-pink-500 rounded-2xl text-sm font-bold text-white shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Save size={18} /> Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                <label className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Data Visibility</label>
                <div className="space-y-3">
                  {['private', 'shared', 'public'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPrivacy(level)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${privacy === level ? 'bg-pink-500/10 border-pink-500/30 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${privacy === level ? 'bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10'}`} />
                        <span className="text-sm font-medium capitalize">{level}</span>
                      </div>
                      {privacy === level && <Check size={16} className="text-pink-400" />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-white/40 leading-relaxed">
                  <span className="text-pink-400 font-bold mr-1">Note:</span> 
                  Your data is encrypted at rest. Setting visibility to "Shared" allows your designated team members to see your workflow history.
                </p>
              </div>
              
              <button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-pink-500 rounded-2xl text-sm font-bold text-white shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Save size={18} /> Save Privacy Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-[#0d1117] border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            
            <div className="p-8">
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
                  <p className="text-sm text-white/40">This action is permanent and will erase all your workflows, chats, and history.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Enter password to confirm</label>
                  <input 
                    type="password" 
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-red-500/40 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-sm font-bold text-white/60 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword || loading}
                    className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
