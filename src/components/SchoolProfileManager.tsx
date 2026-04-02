import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Role } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Settings, Camera, Upload, CheckCircle } from 'lucide-react';
import './managers.css';
import './SchoolProfile.css';

/* ═══════════════════════════════════════════════════════════════════
   School Profile Manager
   ═══════════════════════════════════════════════════════════════════ */

const MAX_LOGO_SIZE = 512 * 1024; // 512 KB

export const SchoolProfileManager = ({ schoolId, role }: { schoolId: string; role?: Role }) => {
  const isOwner = !role || role === 'owner';
  const { profile, refreshProfile } = useAuth();
  const { flash, showFlash } = useFlashMessage(5000);

  const [form, setForm] = useState({
    school_name: '',
    contact: '',
    email: '',
    address: '',
    logo_url: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form from profile on mount
  useEffect(() => {
    if (profile) {
      setForm({
        school_name: profile.school_name || '',
        contact: profile.contact || '',
        email: profile.email || '',
        address: (profile as any).address || '',
        logo_url: profile.logo_url || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  /* ── Logo Upload ──────────────────────────────────────────────── */
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFlash('Please select an image file (PNG, JPG, or SVG)');
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      showFlash('Logo must be under 512 KB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for storage
      const base64 = await fileToBase64(file);
      setForm(prev => ({ ...prev, logo_url: base64 }));
    } catch (err: any) {
      showFlash('Error reading file: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, logo_url: '' }));
  };

  /* ── Save Profile ──────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.school_name.trim()) {
      showFlash('School name is required');
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, string> = {
        school_name: form.school_name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        logo_url: form.logo_url,
      };

      // Only include address if the column exists in the DB
      if (form.address) {
        updates.address = form.address.trim();
      }

      const { error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', schoolId);

      if (error) {
        // If 'address' column doesn't exist, retry without it
        if (error.message?.includes('address') || error.code === '42703') {
          const { error: retryError } = await supabase
            .from('schools')
            .update({
              school_name: form.school_name.trim(),
              contact: form.contact.trim(),
              email: form.email.trim(),
              logo_url: form.logo_url,
            })
            .eq('id', schoolId);

          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      showFlash('School profile updated successfully');
      await refreshProfile();
    } catch (err: any) {
      showFlash('Error updating profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    form.school_name !== (profile?.school_name || '') ||
    form.contact !== (profile?.contact || '') ||
    form.email !== (profile?.email || '') ||
    form.address !== ((profile as any)?.address || '') ||
    form.logo_url !== (profile?.logo_url || '');

  return (
    <div className="manager">
      {/* Toolbar */}
      <div className="manager-toolbar">
        <div className="manager-title">
          <Settings size={24} />
          <div>
            <h3>School Profile</h3>
            <p>Manage your school information</p>
          </div>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className={'flash ' + (flash.startsWith('Error') ? 'error' : 'success')}>
          {flash.startsWith('Error') ? <span>⚠ {flash}</span> : <span>✓ {flash}</span>}
        </div>
      )}

      {/* Profile Card */}
      <div className="profile-card">
        {/* Logo Section */}
        <div className="profile-logo-section">
          <div className="profile-logo-preview" title="School Logo">
            {form.logo_url ? (
              <img src={form.logo_url} alt="School Logo" className="profile-logo-img" />
            ) : (
              <div className="profile-logo-placeholder">
                <Camera size={28} />
                <span>No Logo</span>
              </div>
            )}
          </div>
          {isOwner && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoSelect}
                style={{ display: 'none' }}
              />
              <div className="profile-logo-actions">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploading}
                >
                  <Upload size={14} /> {form.logo_url ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {form.logo_url && (
                  <Button size="sm" variant="ghost" onClick={handleRemoveLogo}>
                    Remove
                  </Button>
                )}
              </div>
              <span className="profile-logo-hint">PNG, JPG, or SVG · Max 512 KB</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="profile-divider" />

        {/* Form */}
        <div className="profile-form">
          <div className="form-section-label">School Information</div>
          {isOwner ? (
            <div className="form-grid">
              <div className="span-2">
                <Input
                  label="School Name"
                  placeholder="Enter school name"
                  value={form.school_name}
                  onChange={handleChange('school_name')}
                  required
                />
              </div>
              <Input
                label="Phone / Contact"
                placeholder="e.g. 0311-1234567"
                value={form.contact}
                onChange={handleChange('contact')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="e.g. school@example.com"
                value={form.email}
                onChange={handleChange('email')}
              />
              <div className="span-2">
                <label className="form-label">Address</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter full school address"
                  value={form.address}
                  onChange={handleChange('address')}
                />
              </div>
            </div>
          ) : (
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">School Name</span>
                <span className="profile-info-value">{form.school_name || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Phone / Contact</span>
                <span className="profile-info-value">{form.contact || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{form.email || '—'}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Address</span>
                <span className="profile-info-value">{form.address || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="profile-divider" />

        {/* Save Button */}
        {isOwner && (
          <div className="profile-save-row">
            <Button
              onClick={handleSave}
              isLoading={saving}
              disabled={!hasChanges}
              size="lg"
            >
              <CheckCircle size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {!hasChanges && (
              <span className="profile-no-changes">All changes saved</span>
            )}
          </div>
        )}
      </div>

      {/* Account Info (read-only) */}
      <div className="profile-card profile-info-card">
        <div className="form-section-label">Account Details</div>
        <div className="profile-info-grid">
          <div className="profile-info-item">
            <span className="profile-info-label">Account ID</span>
            <span className="profile-info-value profile-info-mono">{schoolId.slice(0, 8)}…</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Member Since</span>
            <span className="profile-info-value">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-PK', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Credits Remaining</span>
            <span className="profile-info-value" style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {profile?.total_credits || 0} days
            </span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Credits Expire</span>
            <span className="profile-info-value">
              {profile?.credit_expires_at
                ? new Date(profile.credit_expires_at).toLocaleDateString('en-PK', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────────── */

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
