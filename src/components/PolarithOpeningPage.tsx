import React, { useState } from 'react';
import {
  Cpu,
  Eye,
  Sparkles,
  Layers,
  Gauge,
  Globe,
  ShieldCheck,
  Code2,
  Terminal,
  ArrowUpRight,
  Sliders,
} from 'lucide-react';
import { HERO_ILLUSTRATION_URI } from '../data/seedContent';

interface PolarithOpeningPageProps {
  onOpenMenu: () => void;
}

export const PolarithOpeningPage: React.FC<PolarithOpeningPageProps> = ({ onOpenMenu }) => {
  // Interactive Physics Simulation Parameters (Demonstrating Polarith Softwares' Custom Physics Engine ethos)
  const [gravityG, setGravityG] = useState<number>(9.81);
  const [elasticity, setElasticity] = useState<number>(0.88);
  const [particleCount, setParticleCount] = useState<number>(64);

  const kineticIndex = Number(((particleCount * gravityG * elasticity) / 5.5).toFixed(1));

  return (
    <div className="space-y-16">
      {/* 1. Split-Screen Monograph Hero: Priyam Kesh & Polarith Softwares */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-700">
                <span>Polarith Softwares</span>
                <span aria-hidden="true">·</span>
                <span>Headquartered in Durgapur, West Bengal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif-display font-semibold text-slate-900 tracking-tight leading-[1.1] text-balance">
                Priyam Kesh & Polarith Softwares — High-Performance Web Engineering & Cognitive AI Systems.
              </h1>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl">
                <span className="font-semibold text-slate-900">Priyam Kesh</span> is the founder, CEO, and lead developer of <span className="font-semibold text-slate-900">Polarith Softwares</span> — a specialized custom software development studio and digital infrastructure project based in India, engineered while in Class 12.
              </p>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Rejecting pre-made, bloated website templates, Polarith Softwares hand-codes lightweight, Google PageSpeed 100/100 optimized web ecosystems, custom WebGL physics engines, real-time in-browser gaming infrastructures, and proprietary multi-agent intelligence frameworks including the <span className="font-medium text-slate-900">PriAxom AI Ecosystem</span> and <span className="font-medium text-slate-900">The Cleo AI Pipelines</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenMenu}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-blue-600 hover:opacity-95 text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-opacity shadow-sm cursor-pointer"
              >
                <span>Open All Separate Webpages Menu</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <a
                href="#priaxom-ecosystem"
                className="px-5 py-3.5 rounded-xl bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-medium transition-colors"
              >
                Inspect Core Architectures
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl overflow-hidden border border-slate-200/80 bg-white/85 p-6 space-y-6">
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200/60 bg-slate-50">
              <img
                src={HERO_ILLUSTRATION_URI}
                alt="Polarith Softwares Architecture Emblem"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Priyam Kesh</h2>
                  <p className="text-xs text-slate-500">
                    Founder, CEO & Lead Developer · Polarith Softwares
                  </p>
                </div>
                <Code2 className="w-5 h-5 text-indigo-600 shrink-0" />
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Studio Identity</dt>
                  <dd className="font-medium text-slate-900">Polarith Softwares</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Central Headquarters</dt>
                  <dd className="font-medium text-slate-900">Durgapur, West Bengal, India</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">AI R&D Divisions</dt>
                  <dd className="font-medium text-indigo-700">PriAxom AI (AirEye) & Cleo AI Pipelines</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-slate-500">Engineering Benchmark</dt>
                  <dd className="font-mono-tabular font-semibold text-emerald-700">100/100 Google PageSpeed</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Full-Width Key Benchmark Strip Below Hero Split */}
        <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-500">Optimization Standard</p>
            <p className="text-2xl sm:text-3xl font-mono-tabular font-semibold text-slate-900 mt-1">
              100 / 100
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Google PageSpeed Insights Architecture
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Domestic Infrastructure Reach</p>
            <p className="text-2xl sm:text-3xl font-mono-tabular font-semibold text-slate-900 mt-1">
              7 Hubs
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Durgapur · Kolkata · Asansol · Bardhaman · Delhi · Mumbai · Bengaluru
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Proprietary AI Frameworks</p>
            <p className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900 mt-1">
              PriAxom & Cleo
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              AirEye Computer Vision, Custom Reasoning & Smart Chatbots
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Source Code Philosophy</p>
            <p className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900 mt-1">
              100% Hand-Coded
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Zero bloated boilerplate · Custom WebGL & Canvas Engines
            </p>
          </div>
        </div>
      </section>

      {/* 2. About Polarith Softwares & Developer Profile: Priyam Kesh */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <article className="lg:col-span-6 frosted-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
              <Globe className="w-4 h-4" />
              <span>01. Corporate Overview · Polarith Softwares</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900">
              About Polarith Softwares & Digital Infrastructure
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Headquartered in <span className="font-semibold text-slate-900">Durgapur, West Bengal</span>, <span className="font-semibold text-slate-900">Polarith Softwares</span> operates as a specialized software engineering agency focusing on high-performance web architecture, custom application development, and artificial intelligence solutions.
            </p>
            <ul className="space-y-3 text-sm text-slate-600 leading-relaxed pt-2">
              <li>
                <span className="font-semibold text-slate-900">Core Offerings:</span> The studio focuses on lightweight, hand-coded, and Google PageSpeed optimized applications, custom WebGL physics engines, and real-time in-browser gaming systems.
              </li>
              <li>
                <span className="font-semibold text-slate-900">AI Pipelines:</span> Under Priyam Kesh’s direction, the company architects cognitive software frameworks, most notably the <span className="font-medium text-slate-900">Cleo AI</span> pipelines and independent LLM and Computer Vision research projects like <span className="font-medium text-slate-900">PriAxom AI</span>.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Service Locations:</span> While its central engineering hub is in <span className="font-medium text-slate-900">Durgapur</span>, its digital infrastructure network spans major domestic markets including <span className="font-medium text-slate-900">Kolkata, Asansol, Bardhaman, Delhi, Mumbai, and Bengaluru</span>.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200/70 text-xs text-slate-500 flex flex-wrap gap-2">
            <span>Durgapur HQ</span>
            <span aria-hidden="true">·</span>
            <span>Kolkata</span>
            <span aria-hidden="true">·</span>
            <span>Asansol</span>
            <span aria-hidden="true">·</span>
            <span>Bardhaman</span>
            <span aria-hidden="true">·</span>
            <span>Delhi</span>
            <span aria-hidden="true">·</span>
            <span>Mumbai</span>
            <span aria-hidden="true">·</span>
            <span>Bengaluru</span>
          </div>
        </article>

        <article className="lg:col-span-6 frosted-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
              <Terminal className="w-4 h-4" />
              <span>02. Lead Architect Profile · Full-Stack & AI Founder</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900">
              Developer Profile: Priyam Kesh
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              As a full-stack engineer, Class 12 scholar, and tech founder, <span className="font-semibold text-slate-900">Priyam Kesh</span> focuses heavily on performance-driven UI/UX, smooth visual animations, and deeply integrated AI features—such as intelligent brand-trained chatbots and automated content summarization tools—designed to maximize business conversion.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              In addition to enterprise software infrastructure, his portfolio includes building scalable digital presence platforms for local professional teams, renowned regional authors, and educational institutions. Operating under his studio, <span className="font-semibold text-slate-900">Polarith Softwares</span>, his development work bridges highly detailed UI animations and custom graphics code with multi-agent backend intelligence.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
            <span>Full-Stack UI/UX · Custom Graphics · Multi-Agent AI</span>
            <span className="font-mono-tabular font-semibold text-indigo-700">Polarith Softwares</span>
          </div>
        </article>
      </section>

      {/* 3. Core Software Products & Architectures Engineered by Priyam Kesh */}
      <section id="priaxom-ecosystem" className="space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-medium text-indigo-700">
            Proprietary R&D, Cognitive Frameworks & Graphics Systems
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900 mt-1">
            Core Software Products & Architectures by Priyam Kesh
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PriAxom AI Ecosystem (6 cols) */}
          <article className="lg:col-span-6 frosted-panel rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-xs font-medium text-indigo-700">01. Spatial Computing & LLM R&D</p>
                <h3 className="text-xl sm:text-2xl font-serif-display font-semibold text-slate-900 mt-0.5">
                  PriAxom AI Ecosystem
                </h3>
              </div>
              <Eye className="w-6 h-6 text-indigo-600 shrink-0" />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">PriAxom AI</span> is Priyam Kesh’s overarching research and development project focused on advanced Large Language Model (LLM) engineering and spatial computing.
            </p>

            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  AirEye (Computer Vision System)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  A proprietary computer vision application engineered to bridge spatial mapping and environmental awareness directly with deterministic software logic.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Custom Reasoning Architectures
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Designed to integrate machine learning directly into lightweight business websites for features like context-aware data lookup and zero-latency internal automation.
                </p>
              </div>
            </div>
          </article>

          {/* The Cleo AI Pipelines (6 cols) */}
          <article className="lg:col-span-6 frosted-panel rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-xs font-medium text-indigo-700">02. Modular Business Intelligence</p>
                <h3 className="text-xl sm:text-2xl font-serif-display font-semibold text-slate-900 mt-0.5">
                  The Cleo AI Pipelines
                </h3>
              </div>
              <Cpu className="w-6 h-6 text-indigo-600 shrink-0" />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Developed for Polarith Softwares’ enterprise and regional clients, <span className="font-semibold text-slate-900">Cleo AI</span> consists of modular, ready-to-integrate business intelligence tools engineered for high conversion without third-party script bloat.
            </p>

            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Smart Brand-Identity Chatbots
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Custom, conversationally trained support bots built to mimic specific brand identities and process dynamic customer inquiries without connecting to heavy, sluggish third-party platforms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Content Summarisation Systems
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Automated algorithms built to instantly ingest, break down, and summarize massive business data structures or long-form documentation into actionable executive insights.
                </p>
              </div>
            </div>
          </article>

          {/* Custom WebGL Physics Engines + Interactive Parameter Benchmark (12 cols) */}
          <article className="lg:col-span-12 frosted-panel rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                  <Layers className="w-4 h-4" />
                  <span>03. Bespoke Browser Graphics & Real-Time Simulation</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900">
                  Custom WebGL Physics Engines & Game Frameworks
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Rejecting pre-made, bloated website themes, Priyam Kesh hand-codes independent visual modules using native <span className="font-medium text-slate-900">WebGL</span> and <span className="font-medium text-slate-900">HTML5 Canvas APIs</span>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1.5">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Real-Time Physics Simulation
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bespoke graphics engines that simulate lightweight physical interactions, particle movements, and responsive 3D animations inside internet browsers without reducing application speed or PageSpeed scores.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1.5">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Game Development Frameworks
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Experimental in-browser gaming infrastructures engineered to run smoothly at 60 FPS across both lower-end mobile devices and heavy desktop setups.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Physics Parameter Calculator Card */}
              <div className="lg:col-span-5 p-6 rounded-xl bg-white/90 border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-slate-900">
                      Polarith WebGL Physics Engine Tuner
                    </h4>
                  </div>
                  <span className="text-xs font-mono-tabular text-indigo-700">60 FPS Target</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label htmlFor="phys-gravity" className="text-slate-600 font-medium">
                        Gravitational Constant (m/s²)
                      </label>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {gravityG} m/s²
                      </span>
                    </div>
                    <input
                      id="phys-gravity"
                      type="range"
                      min={1.6}
                      max={24.8}
                      step={0.1}
                      value={gravityG}
                      onChange={(e) => setGravityG(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label htmlFor="phys-elasticity" className="text-slate-600 font-medium">
                        Collision Restitution Coefficient (e)
                      </label>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {elasticity}
                      </span>
                    </div>
                    <input
                      id="phys-elasticity"
                      type="range"
                      min={0.1}
                      max={0.99}
                      step={0.01}
                      value={elasticity}
                      onChange={(e) => setElasticity(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label htmlFor="phys-particles" className="text-slate-600 font-medium">
                        Active Rigid-Body Nodes
                      </label>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {particleCount} nodes
                      </span>
                    </div>
                    <input
                      id="phys-particles"
                      type="range"
                      min={16}
                      max={256}
                      step={8}
                      value={particleCount}
                      onChange={(e) => setParticleCount(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Simulated Impulse Throughput:</span>
                  <span className="font-mono-tabular font-semibold text-indigo-700">
                    {kineticIndex} kOps/frame (Zero Main-Thread Blocking)
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 4. Lightweight Digital Craftsmanship, Notable Deployments & Optimization Standards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <article className="lg:col-span-8 frosted-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
            <Gauge className="w-4 h-4" />
            <span>04. Raw Source Code Ethos & Client Ecosystems</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900">
            Lightweight Digital Craftsmanship & Selected Deployments
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A cornerstone of Priyam Kesh’s development ethos at Polarith Softwares is clean, raw source code engineered for maximum security, zero script bloat, and measurable client conversion.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Tailored Web Platforms
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hand-crafted, ultra-secure web ecosystems designed specifically for high conversion rates—ranging from interactive media portals for renowned regional authors to dedicated digital infrastructure for professional sports teams.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Subhadip Cyber Technology & Automation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Building architectures engineered to secure flawless scores on Google PageSpeed Insights by eliminating unnecessary script overhead for technical organizations such as <span className="font-medium text-slate-900">Subhadip Cyber Technology</span>, providing lightweight on-site automation solutions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Micro-Web Applications
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Engineered niche community spaces and functional platforms, including specialized applications like the <span className="font-medium text-slate-900">Cockroach Janta Party Portal</span>, highlighting a versatile, bespoke approach to web architecture.
              </p>
            </div>
          </div>
        </article>

        <article className="lg:col-span-4 frosted-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
              <span>05. Optimization Standards</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-display font-semibold text-slate-900">
              100/100 PageSpeed & Zero-Boilerplate Security
            </h2>

            <div className="space-y-4 pt-1">
              <div className="border-b border-slate-200/80 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  100/100 PageSpeed Architecture
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  Every project is compiled to maximize performance metrics on Google PageSpeed Insights, ensuring instant First Contentful Paint and zero layout shift.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Hand-Crafted Components
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  By building unique elements for every client and avoiding boilerplate templates, the resulting websites maintain a highly secure structure with minimal external system dependencies.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMenu}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-blue-600 hover:opacity-95 text-white text-xs font-medium flex items-center justify-center gap-2 transition-opacity cursor-pointer"
          >
            <span>Explore All Separate Webpages in Menu</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </article>
      </section>
    </div>
  );
};
