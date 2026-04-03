#!/usr/bin/env node
/**
 * NAVIMAP GENERATOR - Daily Activity Map
 * 
 * Genera _meta/daily-navimap.md amb "qui va fer què" cada dia
 * 
 * CRON: Diari a les 23:59
 */

const fs = require('fs');
const path = require('path');

const MEMORY_ROOT = '/home/user/.openclaw/workspace/memory';
const NAVIMAP_PATH = `${MEMORY_ROOT}/_meta/daily-navimap.md`;
const PROJECTS_PATH = `${MEMORY_ROOT}/Projects`;
const DECISIONS_PATH = `${MEMORY_ROOT}/Decisions`;
const DAILY_PATH = `${MEMORY_ROOT}/Daily`;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getRecentChanges(days = 1) {
  const changes = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Scan Projects
  if (fs.existsSync(PROJECTS_PATH)) {
    const projects = fs.readdirSync(PROJECTS_PATH);
    for (const project of projects) {
      const readmePath = path.join(PROJECTS_PATH, project, 'README.md');
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        const updatedMatch = content.match(/updated:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
        const statusMatch = content.match(/status:\s*["']?(\w+(?:-\w+)?)["']?/);
        const ownerMatch = content.match(/owner:\s*["']?(\w+)["']?/);
        
        if (updatedMatch) {
          const updated = new Date(updatedMatch[1]);
          if (updated >= cutoff) {
            changes.push({
              type: 'project',
              name: project,
              owner: ownerMatch ? ownerMatch[1] : 'unknown',
              status: statusMatch ? statusMatch[1] : 'unknown',
              updated: updatedMatch[1]
            });
          }
        }
      }
    }
  }
  
  // Scan Decisions
  if (fs.existsSync(DECISIONS_PATH)) {
    const decisions = fs.readdirSync(DECISIONS_PATH).filter(f => f.endsWith('.md'));
    for (const decision of decisions) {
      const content = fs.readFileSync(path.join(DECISIONS_PATH, decision), 'utf-8');
      const dateMatch = content.match(/date:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
      const impactMatch = content.match(/impact:\s*["']?(\w+)["']?/);
      
      if (dateMatch) {
        const date = new Date(dateMatch[1]);
        if (date >= cutoff) {
          changes.push({
            type: 'decision',
            name: decision.replace('.md', ''),
            impact: impactMatch ? impactMatch[1] : 'unknown',
            date: dateMatch[1]
          });
        }
      }
    }
  }
  
  return changes;
}

function generateNavimap() {
  const today = getToday();
  const changes = getRecentChanges(1);
  
  // Group by owner/type
  const grouped = {
    projects: changes.filter(c => c.type === 'project'),
    decisions: changes.filter(c => c.type === 'decision')
  };
  
  // Generate markdown
  let md = `# Daily Navimap - ${today}\n\n`;
  md += `_Auto-generat: ${new Date().toISOString()}_\n\n`;
  
  md += `## 📊 Activity Summary\n\n`;
  md += `- Projects actualitzats: ${grouped.projects.length}\n`;
  md += `- Decisions preses: ${grouped.decisions.length}\n\n`;
  
  if (grouped.projects.length > 0) {
    md += `## 📁 Projects\n\n`;
    md += `| Project | Owner | Status | Updated |\n`;
    md += `|---------|-------|--------|--------|\n`;
    for (const p of grouped.projects) {
      md += `| ${p.name} | ${p.owner} | ${p.status} | ${p.updated} |\n`;
    }
    md += `\n`;
  }
  
  if (grouped.decisions.length > 0) {
    md += `## ✅ Decisions\n\n`;
    md += `| Decision | Impact | Date |\n`;
    md += `|----------|--------|------|\n`;
    for (const d of grouped.decisions) {
      md += `| ${d.name} | ${d.impact} | ${d.date} |\n`;
    }
    md += `\n`;
  }
  
  if (grouped.projects.length === 0 && grouped.decisions.length === 0) {
    md += `*No hi ha hagut canvis significatius avui.*\n`;
  }
  
  // Add insights
  md += `## 🔍 Insights\n\n`;
  
  const blockedProjects = grouped.projects.filter(p => p.status === 'blocked');
  if (blockedProjects.length > 0) {
    md += `- ⚠️ ${blockedProjects.length} projecte(s) bloquejat(s): ${blockedProjects.map(p => p.name).join(', ')}\n`;
  }
  
  const criticalProjects = grouped.projects.filter(p => p.status === 'in-progress');
  if (criticalProjects.length > 0) {
    md += `- 🚀 ${criticalProjects.length} projecte(s) en progrés actiu\n`;
  }
  
  const highImpactDecisions = grouped.decisions.filter(d => d.impact === 'high');
  if (highImpactDecisions.length > 0) {
    md += `- 🔴 ${highImpactDecisions.length} decisió(ns) d'alt impacte presa(es)\n`;
  }
  
  // Write
  fs.writeFileSync(NAVIMAP_PATH, md);
  console.log(`✅ Navimap generated: ${NAVIMAP_PATH}`);
  console.log(`   - ${grouped.projects.length} projects actualitzats`);
  console.log(`   - ${grouped.decisions.length} decisions preses`);
}

function main() {
  console.log('🗺️ NAVIMAP GENERATOR');
  console.log('====================\n');
  generateNavimap();
}

main();
