-- Seed pillars (section 2.1 / 14.3) — conversion mapping lives here, not in prompts

INSERT INTO public.pillars (slug, name_en, name_fr, description_en, description_fr, target_product, sort_order)
VALUES
  (
    'retention-memory',
    'Retention & Memory',
    'Rétention & mémoire',
    'Spaced repetition, forgetting curves, and durable learning.',
    'Répétition espacée, courbes d''oubli et apprentissage durable.',
    'nainoforge',
    1
  ),
  (
    'fsrs-algorithms',
    'FSRS & Algorithms',
    'FSRS & algorithmes',
    'How modern scheduling algorithms actually work.',
    'Comment fonctionnent vraiment les algorithmes de planification modernes.',
    'nainoforge',
    2
  ),
  (
    'active-learning',
    'Active Learning',
    'Apprentissage actif',
    'IMPRINT, retrieval practice, and intentional study systems.',
    'IMPRINT, pratique de récupération et systèmes d''étude intentionnels.',
    'nainoforge',
    3
  ),
  (
    'soc-onboarding',
    'SOC Onboarding',
    'Onboarding SOC',
    'Turning new analysts into operational contributors faster.',
    'Transformer plus vite les nouveaux analystes en contributeurs opérationnels.',
    'scyforge',
    4
  ),
  (
    'ops-cyber',
    'Operational Cybersecurity',
    'Cybersécurité opérationnelle',
    'Semantic trees, domain packs, and proof of skill in the SOC.',
    'Arbres sémantiques, Domain Packs et preuve de compétence en SOC.',
    'scyforge',
    5
  ),
  (
    'proof-of-skill',
    'Proof of Skill',
    'Preuve de compétence',
    'Measuring readiness without vanity metrics.',
    'Mesurer la readiness sans métriques de vanité.',
    'scyforge',
    6
  );
