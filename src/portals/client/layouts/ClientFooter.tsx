/**
 * ClientFooter — Compact dark slate footer
 * -----------------------------------------------------------
 * Tuân thủ 100% Prep.vn aesthetic:
 *   - bg-slate-900 border-t border-slate-800 text-slate-400
 *   - 4-column grid (brand + 3 link columns)
 *   - py-6 + gap-6 + text-[11px] cho links
 *   - mt-auto để bám đáy viewport
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const COL_ACADEMIC = [
  { to: '/courses?cert=ielts&track=academic', label: 'IELTS Academic & General' },
  { to: '/courses?cert=toeic', label: 'TOEIC 4-Skills' },
  { to: '/courses?cert=vstep', label: 'VSTEP B2 — C1' },
  { to: '/schedule', label: '1-on-1 Mentorship' },
];

const COL_RESOURCES = [
  { to: '#', label: 'Diagnostic Testing Guidelines' },
  { to: '#', label: 'Scoring Rubrics' },
  { to: '#', label: 'Student Help Center' },
  { to: '#', label: 'Privacy Policy' },
];

const COL_SOCIAL = [
  { Icon: Globe, label: 'Website' },
  { Icon: Mail, label: 'Email' },
  { Icon: Phone, label: 'Phone' },
  { Icon: Sparkles, label: 'Community' },
];

export const ClientFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Col 1: Brand & Mission */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="w-7 h-7 rounded-md bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center"
                aria-hidden="true"
              >
                P
              </div>
              <span className="font-black text-sm text-white">PREP MASTER</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              A standardized testing &amp; language training workspace built for
              serious learners.
            </p>
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-slate-800 text-slate-300 text-[9px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-2.5 h-2.5" />
                ISO 9001
              </span>
              <span className="inline-flex items-center h-5 px-1.5 rounded bg-slate-800 text-slate-300 text-[9px] font-bold uppercase tracking-wider">
                BC Partner
              </span>
            </div>
          </div>

          {/* Col 2: Academic Programs */}
          <div>
            <h4 className="text-xs font-bold text-white mb-2.5">
              Academic Programs
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              {COL_ACADEMIC.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Learning Resources */}
          <div>
            <h4 className="text-xs font-bold text-white mb-2.5">
              Learning Resources
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              {COL_RESOURCES.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: 24/7 Center Support */}
          <div>
            <h4 className="text-xs font-bold text-white mb-2.5">
              24/7 Center Support
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                <span>+1 (415) 555-0186</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">support@prepmaster.io</span>
              </li>
              <li className="text-slate-500 text-[10px]">
                Mon – Sun · 08:00 – 22:00 (UTC+7)
              </li>
            </ul>
            <div className="mt-2.5 flex items-center gap-1.5">
              {COL_SOCIAL.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className={cn(
                    'w-6 h-6 rounded-full bg-slate-800',
                    'inline-flex items-center justify-center',
                    'hover:bg-[#0052CC] transition-colors',
                  )}
                >
                  <Icon className="w-3 h-3 text-slate-300" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
          <span>
            © {year} PrepMaster Platform. Standardized Testing &amp; Language
            Training Workspace. All rights reserved.
          </span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-slate-200 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-slate-200 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-200 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ClientFooter;
