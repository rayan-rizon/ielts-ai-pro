-- IELTS Grammar Lab content version 1
-- Exactly six skills, six guides, and 240 deterministic items:
-- 10 IELTS scenarios x 4 formats for each skill.

insert into public.grammar_skills (
  skill_code,
  learner_label,
  description,
  display_order,
  is_published,
  content_version
)
values
  (
    'grammar_sentence_boundaries',
    'Sentence boundaries',
    'Build complete, readable sentences and avoid fragments, comma splices, and run-ons in IELTS Writing and extended Speaking answers.',
    1,
    true,
    1
  ),
  (
    'grammar_verb_forms',
    'Verb forms',
    'Control tense, aspect, voice, and non-finite verb forms when describing data, processes, experiences, and arguments.',
    2,
    true,
    1
  ),
  (
    'grammar_agreement_number',
    'Agreement & number',
    'Match subjects and verbs, control countable and uncountable nouns, and keep singular and plural references consistent.',
    3,
    true,
    1
  ),
  (
    'grammar_articles_determiners',
    'Articles & determiners',
    'Choose a, an, the, zero article, and other determiners accurately in common Academic IELTS contexts.',
    4,
    true,
    1
  ),
  (
    'grammar_clause_control',
    'Clause control',
    'Link main and dependent clauses clearly to compare, concede, explain causes, define ideas, and qualify claims.',
    5,
    true,
    1
  ),
  (
    'grammar_word_forms',
    'Word forms',
    'Select accurate noun, verb, adjective, and adverb forms in data descriptions, arguments, and spoken explanations.',
    6,
    true,
    1
  )
on conflict (skill_code) do update set
  learner_label = excluded.learner_label,
  description = excluded.description,
  display_order = excluded.display_order,
  is_published = excluded.is_published,
  content_version = excluded.content_version,
  updated_at = now();

insert into public.grammar_resources (
  slug,
  skill_code,
  title,
  summary,
  content_markdown,
  publication_status,
  content_version,
  estimated_minutes
)
values
  (
    'complete-and-controlled-ielts-sentences',
    'grammar_sentence_boundaries',
    'Build complete, controlled IELTS sentences',
    'Use sentence boundaries to make Task 1 comparisons, Task 2 arguments, and longer spoken answers easy to follow.',
    $guide$
## What examiners need to follow

A complete sentence needs a clear main clause. In IELTS Writing, comma splices and fragments can obscure an otherwise strong comparison or argument. In Speaking, sentence boundaries are judged through the structure of the spoken response, not written punctuation.

## Reliable patterns

- Join two complete comparisons with **whereas**, **while**, or a semicolon.
- Attach a reason clause to a complete claim: “This may reduce congestion because commuters have another option.”
- Do not leave **although**, **because**, or **which** clauses without a main clause.

## IELTS application

For Task 1, compare related figures in one controlled sentence. For Task 2, use one main claim and attach only the clauses that support it. In Speaking Parts 2 and 3, pause between complete ideas rather than joining every point with “and”.

## Quick check

Underline the main verb in every clause. If two complete clauses are separated only by a comma, repair the boundary. If a sentence begins with a dependent word, confirm that it reaches a complete main clause.
$guide$,
    'published',
    1,
    6
  ),
  (
    'verb-forms-across-ielts-tasks',
    'grammar_verb_forms',
    'Control verb forms across IELTS tasks',
    'Choose tense, aspect, voice, and verb patterns that match charts, processes, arguments, and personal examples.',
    $guide$
## Match the verb to the IELTS task

Task 1 data may describe a finished period, a current trend, or a future projection. The time reference controls the tense. Process diagrams often need the passive because the process matters more than the actor.

## Reliable patterns

- Finished historical data: “The rate **fell** between 2000 and 2010.”
- Change continuing to the present: “Online enrolment **has increased** since 2020.”
- Process stage: “The material **is heated** before it is filtered.”
- Recommendation: “Governments should **invest**,” not “should investing”.

## Speaking transfer

Use past forms for completed experiences, present forms for routines, and would or might for hypothetical Part 3 ideas. Natural self-correction is acceptable; repeated tense shifts that change the timeline are not.

## Quick check

Circle every time marker, then verify the nearby verb. Check modal verbs, passive forms, and verbs followed by gerunds or infinitives.
$guide$,
    'published',
    1,
    7
  ),
  (
    'agreement-and-number-in-ielts',
    'grammar_agreement_number',
    'Keep agreement and number accurate',
    'Control subjects, verbs, count nouns, mass nouns, percentages, and collective expressions used in IELTS.',
    $guide$
## Find the real subject

Long IELTS sentences often place a phrase between the subject and verb. Ignore the intervening phrase and match the verb to the head noun: “The number of commuters **has** increased.”

## High-value distinctions

- **The number of** + plural noun takes a singular verb.
- **A number of** + plural noun takes a plural verb.
- **Information, research, traffic, equipment** are normally uncountable.
- Percentages agree with the noun that follows: “Sixty per cent of residents **support**…”

## IELTS application

Task 1 frequently uses figures, proportions, categories, and amounts. Task 2 uses abstract mass nouns such as education and evidence. In Speaking, keep pronouns consistent when referring back to singular people, groups, or policies.

## Quick check

Box each subject and underline its verb. Mark every quantity noun as countable or uncountable before choosing a plural ending or determiner.
$guide$,
    'published',
    1,
    6
  ),
  (
    'articles-and-determiners-for-ielts',
    'grammar_articles_determiners',
    'Choose articles precisely in IELTS',
    'Use a, an, the, zero article, and quantity determiners accurately when introducing and revisiting IELTS ideas.',
    $guide$
## Decide what the noun means here

Article choice depends on meaning, not only vocabulary. Use **a/an** for one non-specific singular count noun, **the** for a specific or already identified noun, and zero article for plural or uncountable nouns used generally.

## IELTS patterns

- “The chart shows **the proportion** of households…” because the chart identifies it.
- “Governments need **a long-term policy**” when introducing one possible policy.
- “Public transport reduces congestion” when discussing the idea generally.
- “The public transport system in the city” when referring to a specific system.

## Speaking transfer

In Parts 2 and 3, introduce a person or place with **a/an**, then use **the** when referring to it again. Do not add **the** automatically before general abstract nouns such as technology, education, or society.

## Quick check

For every singular count noun, ask: one of many, or specifically identified? For plural and mass nouns, ask: general, or a defined group?
$guide$,
    'published',
    1,
    6
  ),
  (
    'clause-control-for-complex-ideas',
    'grammar_clause_control',
    'Connect and qualify complex IELTS ideas',
    'Use relative, concessive, conditional, cause, and comparison clauses without losing control of meaning.',
    $guide$
## Complexity must stay clear

IELTS rewards grammatical range when complex structures are accurate and appropriate. Adding clauses does not help if the relationship between ideas becomes unclear.

## Reliable clause purposes

- Contrast: **whereas**, **while**
- Concession: **although**, **even though**
- Cause: **because**, **since**
- Condition: **if**, **provided that**
- Definition: **which**, **that**, **who**

## IELTS application

In Task 1, use comparison clauses to connect related figures. In Task 2, use concession before a clear position: “Although the policy is costly, it may deliver long-term savings.” In Speaking Part 3, conditional clauses help you discuss uncertain outcomes without making absolute claims.

## Quick check

Name the relationship between each pair of clauses. Confirm every dependent clause attaches to a complete main clause, and make sure relative pronouns point to an unmistakable noun.
$guide$,
    'published',
    1,
    7
  ),
  (
    'word-forms-for-academic-accuracy',
    'grammar_word_forms',
    'Use the right word form in IELTS',
    'Choose accurate noun, verb, adjective, and adverb forms in data commentary and analytical explanations.',
    $guide$
## Let the sentence position guide you

Many IELTS errors come from choosing the right word family but the wrong grammatical form. Identify what the sentence needs before selecting the word.

## Position clues

- Before a noun: usually an adjective — “a **significant** increase”
- After a verb describing change: often an adverb — “increased **significantly**”
- As a subject or object: usually a noun — “The **development** affected…”
- After a modal: base verb — “may **benefit**”

## IELTS application

Task 1 repeatedly shifts between noun phrases and verb phrases: “a gradual decline” versus “declined gradually.” Task 2 needs controlled abstract nouns, while Speaking should favour natural forms rather than overly nominal academic language.

## Quick check

Label the missing position N, V, Adj, or Adv. Check common endings, then reread the whole sentence to confirm both grammar and meaning.
$guide$,
    'published',
    1,
    6
  )
on conflict (slug, content_version) do update set
  skill_code = excluded.skill_code,
  title = excluded.title,
  summary = excluded.summary,
  content_markdown = excluded.content_markdown,
  publication_status = excluded.publication_status,
  estimated_minutes = excluded.estimated_minutes,
  updated_at = now();

with seed_cases (
  skill_code,
  case_no,
  difficulty,
  module,
  task,
  scenario,
  correct_sentence,
  incorrect_sentence,
  cloze_sentence,
  answer,
  distractor_one,
  distractor_two,
  explanation
) as (
  values
    -- Sentence boundaries: 10 IELTS-specific cases
    ('grammar_sentence_boundaries', 1, 5, 'writing', 'task_1', 'line graph comparison',
      'Car use rose steadily, whereas bus use remained stable.',
      'Car use rose steadily, bus use remained stable.',
      'Car use rose steadily, ___ bus use remained stable.',
      'whereas', 'because', 'which',
      'Whereas links two complete clauses and makes the contrast explicit; a comma alone would create a comma splice.'),
    ('grammar_sentence_boundaries', 2, 5, 'writing', 'task_1', 'process description',
      'The beans are dried before they are transported to the factory.',
      'The beans are dried. Before they are transported to the factory.',
      'The beans are dried ___ they are transported to the factory.',
      'before', 'although', 'unless',
      'Before introduces a time clause that belongs with the complete process sentence rather than standing as a fragment.'),
    ('grammar_sentence_boundaries', 3, 5, 'writing', 'task_2', 'public transport argument',
      'Public transport can reduce congestion because fewer commuters need to drive.',
      'Because fewer commuters need to drive.',
      'Public transport can reduce congestion ___ fewer commuters need to drive.',
      'because', 'whereas', 'despite',
      'A because-clause needs a main clause; the complete sentence clearly connects the claim with its reason.'),
    ('grammar_sentence_boundaries', 4, 6, 'writing', 'task_1', 'map comparison',
      'The park was expanded; the nearby car park was removed.',
      'The park was expanded, the nearby car park was removed.',
      'The park was expanded; ___ nearby car park was removed.',
      'the', 'because the', 'although',
      'A semicolon can separate two closely related independent clauses; the second clause still needs its subject.'),
    ('grammar_sentence_boundaries', 5, 6, 'writing', 'task_2', 'education policy position',
      'University education should remain affordable. However, students can reasonably share some of the cost.',
      'University education should remain affordable however students can reasonably share some of the cost.',
      'University education should remain affordable. ___, students can reasonably share some of the cost.',
      'However', 'Because', 'Which',
      'However is a sentence adverb here and should introduce a new complete sentence with clear punctuation.'),
    ('grammar_sentence_boundaries', 6, 6, 'speaking', 'part_2', 'describing a memorable journey',
      'The journey was exhausting, but the scenery made it worthwhile.',
      'The journey was exhausting. But the scenery made it worthwhile and.',
      'The journey was exhausting, ___ the scenery made it worthwhile.',
      'but', 'because of', 'which',
      'But coordinates two complete spoken ideas; the repaired sentence avoids an unfinished final fragment.'),
    ('grammar_sentence_boundaries', 7, 6, 'speaking', 'part_3', 'remote work discussion',
      'Remote work offers flexibility, although it can make collaboration more difficult.',
      'Although it can make collaboration more difficult.',
      'Remote work offers flexibility, ___ it can make collaboration more difficult.',
      'although', 'therefore', 'which is',
      'Although introduces a concession that must attach to a complete main clause.'),
    ('grammar_sentence_boundaries', 8, 7, 'writing', 'task_2', 'environmental regulation concession',
      'The regulation may increase short-term costs; nevertheless, it could prevent greater environmental damage.',
      'The regulation may increase short-term costs, nevertheless it could prevent greater environmental damage.',
      'The regulation may increase short-term costs; ___, it could prevent greater environmental damage.',
      'nevertheless', 'because', 'which',
      'Nevertheless connects two independent clauses as a conjunctive adverb and needs a stronger boundary than a comma.'),
    ('grammar_sentence_boundaries', 9, 7, 'writing', 'task_1', 'table overview',
      'Spending was highest in housing. By contrast, transport accounted for the smallest share.',
      'Spending was highest in housing by contrast, transport accounted for the smallest share.',
      'Spending was highest in housing. ___, transport accounted for the smallest share.',
      'By contrast', 'Because', 'Which',
      'By contrast introduces a separate comparison sentence and gives the overview a clear boundary.'),
    ('grammar_sentence_boundaries', 10, 7, 'speaking', 'part_3', 'technology and privacy',
      'People value convenience; they may still object when companies collect data without consent.',
      'People value convenience they may still object when companies collect data without consent.',
      'People value convenience; ___ may still object when companies collect data without consent.',
      'they', 'although they', 'which',
      'The semicolon separates two complete but closely related claims and prevents a run-on sentence.'),

    -- Verb forms: 10 IELTS-specific cases
    ('grammar_verb_forms', 1, 5, 'writing', 'task_1', 'finished line graph period',
      'The unemployment rate fell from 8% to 5% between 2010 and 2015.',
      'The unemployment rate has fallen from 8% to 5% between 2010 and 2015.',
      'The unemployment rate ___ from 8% to 5% between 2010 and 2015.',
      'fell', 'has fallen', 'falls',
      'A finished period with both start and end dates requires the past simple.'),
    ('grammar_verb_forms', 2, 5, 'writing', 'task_1', 'process diagram',
      'The recycled paper is compressed before it is dried.',
      'The recycled paper compresses before it dries by workers.',
      'The recycled paper ___ before it is dried.',
      'is compressed', 'compressed', 'is compressing',
      'The passive form is appropriate because the process stage, not the operator, is the focus.'),
    ('grammar_verb_forms', 3, 5, 'speaking', 'part_1', 'current study routine',
      'I usually review my notes on the bus home.',
      'I am usually review my notes on the bus home.',
      'I usually ___ my notes on the bus home.',
      'review', 'reviewing', 'reviewed',
      'Usually describes a routine, so the present simple base form is required after the subject.'),
    ('grammar_verb_forms', 4, 6, 'writing', 'task_1', 'trend continuing to present',
      'Online enrolment has increased steadily since 2020.',
      'Online enrolment increased steadily since 2020 and continues now.',
      'Online enrolment ___ steadily since 2020.',
      'has increased', 'increased', 'had increased',
      'Since 2020 marks a period continuing to the present, so the present perfect is appropriate.'),
    ('grammar_verb_forms', 5, 6, 'writing', 'task_2', 'government recommendation',
      'Governments should invest more in preventative healthcare.',
      'Governments should investing more in preventative healthcare.',
      'Governments should ___ more in preventative healthcare.',
      'invest', 'investing', 'invested',
      'A modal verb is followed by the base form without to.'),
    ('grammar_verb_forms', 6, 6, 'speaking', 'part_2', 'completed personal experience',
      'I had never travelled alone before I took that trip.',
      'I never travelled alone before I had took that trip.',
      'I ___ alone before I took that trip.',
      'had never travelled', 'never travel', 'have never travelled',
      'The past perfect places the earlier experience before another completed past event.'),
    ('grammar_verb_forms', 7, 6, 'speaking', 'part_3', 'hypothetical transport policy',
      'If fares were lower, more commuters would use the train.',
      'If fares would be lower, more commuters used the train.',
      'If fares were lower, more commuters ___ the train.',
      'would use', 'will use', 'used',
      'A hypothetical present condition uses past form in the if-clause and would plus base verb in the result.'),
    ('grammar_verb_forms', 8, 7, 'writing', 'task_1', 'projected population chart',
      'The urban population is projected to reach 70% by 2040.',
      'The urban population projects reaching 70% by 2040.',
      'The urban population ___ 70% by 2040.',
      'is projected to reach', 'projects to reach', 'was reaching',
      'The passive reporting form distinguishes a projection from an observed historical result.'),
    ('grammar_verb_forms', 9, 7, 'writing', 'task_2', 'policy evaluation',
      'Having considered the financial cost, the council postponed the scheme.',
      'Having consider the financial cost, the council postponed the scheme.',
      '___ the financial cost, the council postponed the scheme.',
      'Having considered', 'Having consider', 'Considered having',
      'The perfect participle shows that the consideration happened before the decision.'),
    ('grammar_verb_forms', 10, 7, 'speaking', 'part_3', 'change over time',
      'By the time electric cars become affordable, charging networks may have expanded substantially.',
      'By the time electric cars will become affordable, charging networks may expanded substantially.',
      'By the time electric cars become affordable, charging networks ___ substantially.',
      'may have expanded', 'may expanded', 'will have expand',
      'May have plus past participle expresses a possible completed development by a future point.'),

    -- Agreement and number: 10 IELTS-specific cases
    ('grammar_agreement_number', 1, 5, 'writing', 'task_1', 'number of commuters',
      'The number of rail commuters has increased.',
      'The number of rail commuters have increased.',
      'The number of rail commuters ___ increased.',
      'has', 'have', 'are',
      'The head subject is the singular noun number, so it takes has.'),
    ('grammar_agreement_number', 2, 5, 'writing', 'task_2', 'uncountable research',
      'Recent research provides useful evidence for the policy.',
      'Recent researches provide useful evidences for the policy.',
      'Recent research ___ useful evidence for the policy.',
      'provides', 'provide', 'are providing',
      'Research and evidence are normally uncountable here, and the singular mass noun research takes provides.'),
    ('grammar_agreement_number', 3, 5, 'speaking', 'part_1', 'transport routine',
      'Most people in my neighbourhood use buses.',
      'Most people in my neighbourhood uses buses.',
      'Most people in my neighbourhood ___ buses.',
      'use', 'uses', 'is using',
      'The plural subject people takes the base present form use.'),
    ('grammar_agreement_number', 4, 6, 'writing', 'task_1', 'percentage of residents',
      'Sixty per cent of residents support the proposal.',
      'Sixty per cent of residents supports the proposal.',
      'Sixty per cent of residents ___ the proposal.',
      'support', 'supports', 'is supporting',
      'The percentage refers to plural residents, so the verb is plural.'),
    ('grammar_agreement_number', 5, 6, 'writing', 'task_1', 'amount of waste',
      'The amount of household waste was lower in 2020.',
      'The amount of household waste were lower in 2020.',
      'The amount of household waste ___ lower in 2020.',
      'was', 'were', 'have been',
      'Amount is the singular head noun, even though it is followed by a long prepositional phrase.'),
    ('grammar_agreement_number', 6, 6, 'writing', 'task_2', 'public transport benefits',
      'One of the main benefits is reduced congestion.',
      'One of the main benefits are reduced congestion.',
      'One of the main benefits ___ reduced congestion.',
      'is', 'are', 'were',
      'One is the singular subject, so the linking verb must be singular.'),
    ('grammar_agreement_number', 7, 6, 'speaking', 'part_2', 'describing useful equipment',
      'The equipment in the library is easy to use.',
      'The equipments in the library are easy to use.',
      'The equipment in the library ___ easy to use.',
      'is', 'are', 'have',
      'Equipment is an uncountable noun and takes a singular verb in this meaning.'),
    ('grammar_agreement_number', 8, 7, 'writing', 'task_2', 'a range of policies',
      'The range of available policies is broad.',
      'The range of available policies are broad.',
      'The range of available policies ___ broad.',
      'is', 'are', 'have been',
      'The singular head noun range requires the singular verb is.'),
    ('grammar_agreement_number', 9, 7, 'writing', 'task_1', 'combined categories',
      'Neither private cars nor public buses were the largest category.',
      'Neither private cars nor public buses was the largest category.',
      'Neither private cars nor public buses ___ the largest category.',
      'were', 'was', 'is',
      'With neither nor, the verb commonly agrees with the nearer subject; public buses is plural.'),
    ('grammar_agreement_number', 10, 7, 'speaking', 'part_3', 'survey findings',
      'The results of the survey have influenced public opinion.',
      'The results of the survey has influenced public opinion.',
      'The results of the survey ___ influenced public opinion.',
      'have', 'has', 'is having',
      'Results is the plural head noun, so the present perfect auxiliary must be have.'),

    -- Articles and determiners: 10 IELTS-specific cases
    ('grammar_articles_determiners', 1, 5, 'writing', 'task_1', 'introducing a chart',
      'The chart illustrates the proportion of households with internet access.',
      'Chart illustrates proportion of households with internet access.',
      'The chart illustrates ___ proportion of households with internet access.',
      'the', 'a', 'an',
      'The chart identifies a specific proportion shown in the visual, so the definite article is required.'),
    ('grammar_articles_determiners', 2, 5, 'writing', 'task_2', 'general public transport',
      'Public transport can reduce urban congestion.',
      'The public transport can reduce the urban congestion.',
      '___ transport can reduce urban congestion.',
      'Public', 'The public', 'A public',
      'Public transport and urban congestion are general concepts here, so no article is needed before them.'),
    ('grammar_articles_determiners', 3, 5, 'speaking', 'part_2', 'introducing a person',
      'A teacher at my secondary school encouraged me to read more.',
      'Teacher at my secondary school encouraged me to read more.',
      '___ teacher at my secondary school encouraged me to read more.',
      'A', 'The', 'An',
      'The speaker is introducing one non-specific teacher for the first time, so a is appropriate.'),
    ('grammar_articles_determiners', 4, 6, 'writing', 'task_1', 'specific highest figure',
      'The highest figure was recorded in the final year.',
      'A highest figure was recorded in final year.',
      '___ highest figure was recorded in the final year.',
      'The', 'A', 'An',
      'Superlatives normally take the because they identify one extreme in a defined set.'),
    ('grammar_articles_determiners', 5, 6, 'writing', 'task_2', 'introducing a solution',
      'Governments need a long-term strategy for affordable housing.',
      'Governments need long-term strategy for affordable housing.',
      'Governments need ___ long-term strategy for affordable housing.',
      'a', 'the', 'an',
      'The sentence introduces one possible strategy rather than a previously specified strategy.'),
    ('grammar_articles_determiners', 6, 6, 'speaking', 'part_2', 'revisiting a place',
      'I visited a coastal town, and the town was much quieter than I expected.',
      'I visited the coastal town, and a town was much quieter than I expected.',
      'I visited a coastal town, and ___ town was much quieter than I expected.',
      'the', 'a', 'an',
      'A introduces the town; the is used when the same specific town is mentioned again.'),
    ('grammar_articles_determiners', 7, 6, 'speaking', 'part_3', 'general technology',
      'Technology has changed the way people access information.',
      'The technology has changed the way people access information.',
      '___ has changed the way people access information.',
      'Technology', 'The technology', 'A technology',
      'Technology and information are used generally, while the way is a specific expression defined by the following clause.'),
    ('grammar_articles_determiners', 8, 7, 'writing', 'task_2', 'qualified abstract noun',
      'The education programme described in the report serves rural areas.',
      'An education programme described in the report serves rural areas.',
      '___ education programme described in the report serves rural areas.',
      'The', 'An', 'A',
      'The report identifies one specific education programme, so the definite article is required.'),
    ('grammar_articles_determiners', 9, 7, 'writing', 'task_1', 'quantity comparison',
      'Far fewer people used the ferry than the underground.',
      'Much fewer people used ferry than underground.',
      '___ people used the ferry than the underground.',
      'Far fewer', 'Much fewer', 'A little',
      'People is countable plural, so fewer is required; far intensifies the comparison naturally.'),
    ('grammar_articles_determiners', 10, 7, 'speaking', 'part_3', 'balanced quantification',
      'There is little evidence that longer working hours improve productivity.',
      'There is few evidence that longer working hours improve productivity.',
      'There is ___ evidence that longer working hours improve productivity.',
      'little', 'few', 'many',
      'Evidence is uncountable, so little expresses a small amount; general productivity takes no article.'),

    -- Clause control: 10 IELTS-specific cases
    ('grammar_clause_control', 1, 5, 'writing', 'task_1', 'contrasting chart trends',
      'While car ownership increased, bicycle use declined.',
      'While car ownership increased, and bicycle use declined.',
      '___ car ownership increased, bicycle use declined.',
      'While', 'Because of', 'Despite',
      'While correctly introduces a finite contrast clause and connects it to a complete main clause.'),
    ('grammar_clause_control', 2, 5, 'writing', 'task_2', 'reason for congestion',
      'Congestion worsens because many commuters travel at the same time.',
      'Congestion worsens because of many commuters travel at the same time.',
      'Congestion worsens ___ many commuters travel at the same time.',
      'because', 'because of', 'despite',
      'Because is followed by a full clause; because of would require a noun phrase.'),
    ('grammar_clause_control', 3, 5, 'speaking', 'part_2', 'defining a useful app',
      'It is an app that helps me organise my study schedule.',
      'It is an app what helps me organise my study schedule.',
      'It is an app ___ helps me organise my study schedule.',
      'that', 'what', 'where',
      'That introduces a defining relative clause referring back to app.'),
    ('grammar_clause_control', 4, 6, 'writing', 'task_1', 'concession in overview',
      'Although both figures rose, the increase in rail use was much larger.',
      'Despite both figures rose, the increase in rail use was much larger.',
      '___ both figures rose, the increase in rail use was much larger.',
      'Although', 'Despite', 'Because of',
      'Although takes a finite clause; despite would need a noun phrase or gerund.'),
    ('grammar_clause_control', 5, 6, 'writing', 'task_2', 'conditional policy result',
      'If cities improve bus reliability, more drivers may leave their cars at home.',
      'If cities will improve bus reliability, more drivers may leave their cars at home.',
      '___ cities improve bus reliability, more drivers may leave their cars at home.',
      'If', 'Unless if', 'Despite',
      'A realistic future condition uses present simple in the if-clause and a modal in the result.'),
    ('grammar_clause_control', 6, 6, 'speaking', 'part_3', 'qualifying a generalisation',
      'People who work remotely may have more control over their schedules.',
      'People which work remotely may have more control over their schedules.',
      'People ___ work remotely may have more control over their schedules.',
      'who', 'which', 'where',
      'Who is the appropriate relative pronoun for people in a defining clause.'),
    ('grammar_clause_control', 7, 6, 'writing', 'task_2', 'concession before position',
      'Although the scheme is expensive, its long-term benefits may justify the cost.',
      'Although the scheme is expensive, but its long-term benefits may justify the cost.',
      '___ the scheme is expensive, its long-term benefits may justify the cost.',
      'Although', 'But although', 'Despite of',
      'Although already marks the contrast, so an additional but is not needed.'),
    ('grammar_clause_control', 8, 7, 'writing', 'task_1', 'non-defining relative clause',
      'The northern route, which opened in 2015, carried the most passengers.',
      'The northern route, that opened in 2015, carried the most passengers.',
      'The northern route, ___ opened in 2015, carried the most passengers.',
      'which', 'that', 'what',
      'Which is used in this non-defining relative clause, set off by commas.'),
    ('grammar_clause_control', 9, 7, 'writing', 'task_2', 'condition with limitation',
      'The policy will be effective only if local authorities enforce it consistently.',
      'The policy will be effective unless local authorities enforce it consistently.',
      'The policy will be effective ___ local authorities enforce it consistently.',
      'only if', 'unless', 'despite',
      'Only if states the necessary condition; unless would reverse the intended meaning.'),
    ('grammar_clause_control', 10, 7, 'speaking', 'part_3', 'cautious causal explanation',
      'Since housing costs vary by region, a national policy may not affect every city equally.',
      'Since housing costs vary by region, so a national policy may not affect every city equally.',
      '___ housing costs vary by region, a national policy may not affect every city equally.',
      'Since', 'Since so', 'Despite of',
      'Since introduces the reason clause; adding so would duplicate the connector.'),

    -- Word forms: 10 IELTS-specific cases
    ('grammar_word_forms', 1, 5, 'writing', 'task_1', 'describing a large change',
      'There was a significant increase in online sales.',
      'There was a significantly increase in online sales.',
      'There was a ___ increase in online sales.',
      'significant', 'significantly', 'significance',
      'An adjective is needed before the noun increase.'),
    ('grammar_word_forms', 2, 5, 'writing', 'task_1', 'modifying a change verb',
      'Online sales increased significantly.',
      'Online sales increased significant.',
      'Online sales increased ___.',
      'significantly', 'significant', 'significance',
      'An adverb modifies the verb increased.'),
    ('grammar_word_forms', 3, 5, 'speaking', 'part_1', 'describing convenience',
      'The location is convenient for students.',
      'The location is convenience for students.',
      'The location is ___ for students.',
      'convenient', 'convenience', 'conveniently',
      'An adjective is required after the linking verb is to describe the location.'),
    ('grammar_word_forms', 4, 6, 'writing', 'task_2', 'economic policy benefit',
      'The policy could benefit low-income households.',
      'The policy could beneficial low-income households.',
      'The policy could ___ low-income households.',
      'benefit', 'beneficial', 'benefitably',
      'A modal verb requires the base verb benefit.'),
    ('grammar_word_forms', 5, 6, 'writing', 'task_1', 'gradual decline',
      'The figure declined gradually over the period.',
      'The figure declined gradual over the period.',
      'The figure declined ___ over the period.',
      'gradually', 'gradual', 'gradation',
      'The adverb gradually modifies how the figure declined.'),
    ('grammar_word_forms', 6, 6, 'speaking', 'part_2', 'describing an impressive building',
      'I was impressed by the building’s unusual design.',
      'I was impressive by the building’s unusually design.',
      'I was ___ by the building’s unusual design.',
      'impressed', 'impressive', 'impression',
      'Impressed describes the speaker’s feeling; impressive would describe the building.'),
    ('grammar_word_forms', 7, 6, 'speaking', 'part_3', 'environmental responsibility',
      'Companies should act responsibly when disposing of waste.',
      'Companies should act responsible when disposing of waste.',
      'Companies should act ___ when disposing of waste.',
      'responsibly', 'responsible', 'responsibility',
      'An adverb is needed to modify the verb act.'),
    ('grammar_word_forms', 8, 7, 'writing', 'task_2', 'assessing feasibility',
      'The financial feasibility of the proposal remains uncertain.',
      'The financial feasible of the proposal remains uncertainty.',
      'The financial ___ of the proposal remains uncertain.',
      'feasibility', 'feasible', 'feasibly',
      'A noun is needed as the head of the subject phrase after the adjective financial.'),
    ('grammar_word_forms', 9, 7, 'writing', 'task_1', 'stable data period',
      'The figure remained relatively stable for three years.',
      'The figure remained relative stability for three years.',
      'The figure remained ___ stable for three years.',
      'relatively', 'relative', 'relation',
      'An adverb is needed to modify the adjective stable.'),
    ('grammar_word_forms', 10, 7, 'speaking', 'part_3', 'technology accessibility',
      'Greater accessibility does not automatically guarantee meaningful participation.',
      'Greater accessible does not automatically guarantee meaningfully participation.',
      'Greater ___ does not automatically guarantee meaningful participation.',
      'accessibility', 'accessible', 'accessibly',
      'A noun is required as the sentence subject, while meaningful correctly modifies participation.')
),
expanded as (
  select
    c.skill_code,
    c.case_no,
    c.difficulty,
    c.module,
    c.task,
    c.scenario,
    f.question_format,
    f.prompt,
    f.options,
    f.answer_data,
    c.explanation
  from seed_cases c
  cross join lateral (
    values
      (
        'form_selection'::text,
        format(
          'In an Academic IELTS %s %s response about %s, choose the form that completes this sentence accurately: “%s”',
          initcap(c.module),
          replace(c.task, '_', ' '),
          c.scenario,
          c.cloze_sentence
        ),
        jsonb_build_array(c.answer, c.distractor_one, c.distractor_two),
        jsonb_build_object('accepted', jsonb_build_array(c.answer), 'display', c.answer)
      ),
      (
        'error_correction'::text,
        format(
          'Correct the grammatical error in this Academic IELTS %s %s sentence. Change only what is necessary: “%s”',
          initcap(c.module),
          replace(c.task, '_', ' '),
          c.incorrect_sentence
        ),
        null::jsonb,
        jsonb_build_object('accepted', jsonb_build_array(c.correct_sentence), 'display', c.correct_sentence)
      ),
      (
        'sentence_completion'::text,
        format(
          'Complete this Academic IELTS %s %s sentence about %s with the missing grammatical form: “%s”',
          initcap(c.module),
          replace(c.task, '_', ' '),
          c.scenario,
          c.cloze_sentence
        ),
        null::jsonb,
        jsonb_build_object('accepted', jsonb_build_array(c.answer), 'display', c.answer)
      ),
      (
        'meaning_preserving_transformation'::text,
        format(
          'Choose the grammatically accurate revision of this Academic IELTS %s %s sentence. The revision must preserve the original meaning: “%s”',
          initcap(c.module),
          replace(c.task, '_', ' '),
          c.incorrect_sentence
        ),
        jsonb_build_array(c.correct_sentence, c.incorrect_sentence),
        jsonb_build_object('accepted', jsonb_build_array(c.correct_sentence), 'display', c.correct_sentence)
      )
  ) as f(question_format, prompt, options, answer_data)
)
insert into public.grammar_items (
  skill_code,
  difficulty,
  question_format,
  prompt,
  options,
  answer_data,
  explanation,
  academic_context,
  publication_status,
  content_version,
  content_key
)
select
  e.skill_code,
  e.difficulty,
  e.question_format,
  e.prompt,
  e.options,
  e.answer_data,
  e.explanation,
  jsonb_build_object(
    'track', 'academic',
    'module', e.module,
    'task', e.task,
    'scenario', e.scenario,
    'bandFocus', e.difficulty
  ),
  'published',
  1,
  format('%s_%s_%s', e.skill_code, lpad(e.case_no::text, 2, '0'), e.question_format)
from expanded e
on conflict (content_key, content_version) do update set
  skill_code = excluded.skill_code,
  difficulty = excluded.difficulty,
  question_format = excluded.question_format,
  prompt = excluded.prompt,
  options = excluded.options,
  answer_data = excluded.answer_data,
  explanation = excluded.explanation,
  academic_context = excluded.academic_context,
  publication_status = excluded.publication_status,
  updated_at = now();

do $$
declare
  v_item_count integer;
  v_skill_count integer;
  v_resource_count integer;
  v_bad_skill_count integer;
begin
  select count(*)
  into v_item_count
  from public.grammar_items
  where publication_status = 'published' and content_version = 1;

  select count(*)
  into v_skill_count
  from public.grammar_skills
  where is_published and content_version = 1;

  select count(*)
  into v_resource_count
  from public.grammar_resources
  where publication_status = 'published' and content_version = 1;

  select count(*)
  into v_bad_skill_count
  from (
    select skill_code
    from public.grammar_items
    where publication_status = 'published' and content_version = 1
    group by skill_code
    having count(*) <> 40
  ) invalid_counts;

  if v_item_count <> 240 or v_skill_count <> 6 or v_resource_count <> 6 or v_bad_skill_count <> 0 then
    raise exception
      'Grammar Lab seed integrity failed: items %, skills %, resources %, invalid skill counts %',
      v_item_count,
      v_skill_count,
      v_resource_count,
      v_bad_skill_count;
  end if;
end
$$;
