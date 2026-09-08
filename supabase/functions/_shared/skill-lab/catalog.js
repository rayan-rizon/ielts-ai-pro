// Server-only curriculum. Never import this module into the browser bundle.
// Keys and transcripts are delivered only after an answer has been committed.
const situations = [
  [
    'library',
    'The library now closes at eight instead of six.',
    'The library closes later than before.',
    'True',
    'extended opening hours',
  ],
  [
    'buses',
    'Electric buses replaced half the diesel fleet last year.',
    'All diesel buses were replaced.',
    'False',
    'partial fleet replacement',
  ],
  [
    'museum',
    'Museum visitors can book tickets online.',
    'Online tickets cost less than tickets at the door.',
    'Not Given',
    'online booking availability',
  ],
  [
    'garden',
    'Volunteers meet in the garden every second Saturday.',
    'Volunteers meet every Saturday.',
    'False',
    'a fortnightly meeting',
  ],
  [
    'course',
    'The evening course runs for six weeks and starts in May.',
    'The course begins in May.',
    'True',
    'a six-week evening course',
  ],
  [
    'pool',
    'The pool is closed on Mondays for cleaning.',
    'The pool offers swimming lessons.',
    'Not Given',
    'a weekly maintenance closure',
  ],
  [
    'bicycles',
    'More residents cycled to work after a protected lane opened.',
    'Cycling to work increased after the lane opened.',
    'True',
    'growth in cycle commuting',
  ],
  [
    'market',
    'The market moved indoors because rain damaged the stalls.',
    'The market moved because it needed more customers.',
    'False',
    'relocation after weather damage',
  ],
  [
    'cafe',
    'The cafe buys its coffee from two local suppliers.',
    'The cafe sells organic coffee.',
    'Not Given',
    'local coffee purchasing',
  ],
  [
    'trains',
    'The new timetable reduced the wait between trains from fifteen to ten minutes.',
    'Passengers wait less time between trains.',
    'True',
    'more frequent trains',
  ],
  [
    'school',
    'Students may borrow two books at a time.',
    'Students may borrow three books at once.',
    'False',
    'a borrowing limit',
  ],
  [
    'park',
    'The park has a new walking trail around the lake.',
    'The trail is suitable for wheelchairs.',
    'Not Given',
    'a new lakeside path',
  ],
  [
    'recycling',
    'Households separated more paper after receiving labelled bins.',
    'Labelled bins were followed by increased paper separation.',
    'True',
    'improved paper recycling',
  ],
  [
    'concert',
    'Tickets must be collected before noon on Friday.',
    'Tickets can be collected on Friday afternoon.',
    'False',
    'a ticket collection deadline',
  ],
  [
    'bakery',
    'The bakery opens at seven on weekdays.',
    'The bakery opens at seven on Sundays.',
    'Not Given',
    'weekday opening times',
  ],
  [
    'office',
    'Staff saved travel time by working from home twice a week.',
    'Working from home reduced commuting time.',
    'True',
    'less time commuting',
  ],
  [
    'tour',
    'The walking tour includes the castle but not the harbour.',
    'The tour visits the harbour.',
    'False',
    'a limited tour route',
  ],
  [
    'clinic',
    'Patients can request appointments by phone or through the website.',
    'Website appointments are confirmed immediately.',
    'Not Given',
    'two booking methods',
  ],
  [
    'water',
    'Water use fell after leaking pipes were repaired.',
    'Repairing leaks was followed by lower water use.',
    'True',
    'reduced water consumption',
  ],
  [
    'workshop',
    'The workshop fee covers materials but excludes lunch.',
    'Lunch is included in the fee.',
    'False',
    'what the fee includes',
  ],
  [
    'station',
    'A waiting room was added beside platform two.',
    'The waiting room is heated.',
    'Not Given',
    'a new waiting facility',
  ],
  [
    'orchard',
    'Farmers planted more varieties to reduce dependence on one crop.',
    'Farmers wanted to rely less on a single crop.',
    'True',
    'diversification of crops',
  ],
  [
    'festival',
    'The festival takes place in September, not August as first announced.',
    'The festival is in August.',
    'False',
    'a revised festival date',
  ],
  [
    'gallery',
    'The gallery displays paintings by regional artists.',
    'The paintings are available to buy.',
    'Not Given',
    'an exhibition of regional art',
  ],
];
const bookings = [
  ['pottery', 'Tuesday', 'Thursday', '14', 'studio'],
  ['photography', 'Monday', 'Friday', '26', 'camera'],
  ['gardening', 'Saturday', 'Sunday', '18', 'gloves'],
  ['history', 'Wednesday', 'Monday', '32', 'notebook'],
  ['cooking', 'Friday', 'Tuesday', '21', 'apron'],
  ['cycling', 'Sunday', 'Saturday', '45', 'helmet'],
  ['painting', 'Thursday', 'Wednesday', '16', 'brush'],
  ['music', 'Tuesday', 'Friday', '28', 'folder'],
  ['woodwork', 'Monday', 'Thursday', '35', 'pencil'],
  ['dance', 'Saturday', 'Wednesday', '12', 'water'],
  ['theatre', 'Wednesday', 'Sunday', '24', 'ticket'],
  ['sewing', 'Friday', 'Monday', '19', 'fabric'],
  ['astronomy', 'Sunday', 'Thursday', '38', 'jacket'],
  ['writing', 'Thursday', 'Tuesday', '22', 'laptop'],
  ['yoga', 'Monday', 'Saturday', '17', 'mat'],
  ['walking', 'Saturday', 'Friday', '30', 'boots'],
  ['rowing', 'Tuesday', 'Sunday', '41', 'towel'],
  ['chess', 'Wednesday', 'Thursday', '15', 'clock'],
  ['printing', 'Friday', 'Wednesday', '27', 'paper'],
  ['film', 'Sunday', 'Monday', '36', 'headphones'],
  ['geology', 'Thursday', 'Saturday', '23', 'bag'],
  ['poetry', 'Monday', 'Tuesday', '29', 'book'],
  ['weaving', 'Saturday', 'Thursday', '31', 'thread'],
  ['design', 'Wednesday', 'Friday', '25', 'ruler'],
];
const argumentsData = [
  [
    'Public libraries should offer evening hours.',
    'People who work during the day can then borrow books after work.',
    'A nurse finishing at six could visit at seven.',
  ],
  [
    'Cities should protect cycle lanes.',
    'Separating bicycles from cars can make the journey safer.',
    'A physical barrier keeps turning vehicles out of the cycle lane.',
  ],
  [
    'Schools should provide quiet reading time.',
    'An uninterrupted period helps students focus on a text.',
    'A class could read for fifteen minutes before discussing the story.',
  ],
  [
    'Parks need shaded seating.',
    'Shade gives visitors a place to rest during hot weather.',
    'Older walkers could pause under a tree rather than leave early.',
  ],
  [
    'Employers should allow flexible start times.',
    'Some workers can avoid the busiest commuting period.',
    'Starting at ten instead of nine may allow a less crowded train journey.',
  ],
  [
    'Museums should label exhibits clearly.',
    'Visitors need context to understand unfamiliar objects.',
    'A date and short description can explain how a tool was used.',
  ],
  [
    'Universities should teach basic budgeting.',
    'Students often manage rent and food costs for the first time.',
    'A monthly spending exercise can reveal whether rent leaves enough for meals.',
  ],
  [
    'Local markets should provide reusable crates.',
    'Returning containers can reduce disposable packaging.',
    'A vegetable seller could refill the same crate each week.',
  ],
  [
    'Public buildings need clear signs.',
    'Visitors can find services without asking for directions.',
    'A large reception sign helps a first-time visitor identify the right desk.',
  ],
  [
    'Schools should include practical science.',
    'Experiments connect an abstract explanation to an observable result.',
    'Watching ice melt lets pupils examine a change of state.',
  ],
  [
    'Towns should maintain walking paths.',
    'An even surface makes short journeys more accessible.',
    'Repairing a broken pavement helps a person using a walking frame.',
  ],
  [
    'Community centres should lend equipment.',
    'Sharing reduces the need to buy rarely used items.',
    'Residents could borrow a projector for an occasional meeting.',
  ],
  [
    'Offices should provide quiet rooms.',
    'Some tasks require sustained concentration.',
    'An analyst could check a report away from telephone conversations.',
  ],
  [
    'Schools should teach cooking skills.',
    'Simple recipes help students prepare meals independently.',
    'A student who can cook rice and vegetables has an affordable dinner option.',
  ],
  [
    'Bus stops should display arrival times.',
    'Knowing the expected wait helps passengers plan their journey.',
    'A passenger can decide whether there is time to buy water nearby.',
  ],
  [
    'Sports clubs should offer beginner sessions.',
    'New participants may need slower instruction before joining experienced players.',
    'A first-time player can practise serving before playing a match.',
  ],
  [
    'Councils should repair leaking pipes.',
    'Preventing losses preserves treated water.',
    'Fixing a street leak keeps water in the supply network.',
  ],
  [
    'Libraries should lend digital books.',
    'Readers can borrow without travelling to a branch.',
    'Someone recovering at home could download a novel.',
  ],
  [
    'Workplaces should explain new software.',
    'Training reduces confusion when familiar procedures change.',
    'A short demonstration can show staff where to save a shared document.',
  ],
  [
    'Neighbourhoods should organise litter collections.',
    'Coordinated work can cover a larger area.',
    'Small teams can clean separate streets on the same morning.',
  ],
  [
    'Schools should maintain vegetable gardens.',
    'Growing plants helps pupils observe how food develops.',
    'Measuring a bean plant each week records its growth.',
  ],
  [
    'Stations should provide covered waiting areas.',
    'Shelter makes waiting more comfortable in poor weather.',
    'Passengers can stay dry during a rain shower.',
  ],
  [
    'Clinics should send appointment reminders.',
    'A reminder helps patients remember a booking made weeks earlier.',
    'A message the previous day gives time to arrange transport.',
  ],
  [
    'Universities should provide study groups.',
    'Discussion lets learners compare explanations of difficult material.',
    'One student can explain a worked example while another checks the reasoning.',
  ],
];
const definitions = [
  [
    'reading_true_false_not_given',
    'reading',
    'False or Not Given?',
    'Separate contradiction from missing information.',
    'Do not treat a missing detail as false.',
    'Check each part of the statement. Find support or a contradiction. If neither exists, choose Not Given.',
    'The shop opens at nine. → It opens at ten: False. It closes at six: Not Given.',
  ],
  [
    'reading_paraphrase_matching',
    'reading',
    'Recognise the same meaning',
    'Match meaning even when the wording changes.',
    'A shared word does not guarantee a shared meaning.',
    'Compare who, what, quantity and time. Reject an option that adds or reverses a detail.',
    'Reduced waiting time means a shorter wait, not a shorter journey.',
  ],
  [
    'reading_matching_headings',
    'reading',
    'Find the main idea',
    'Choose a heading covering the whole paragraph.',
    'An example can distract from the main point.',
    'Summarise the paragraph in a few words, then compare the breadth of each heading.',
    'A paragraph explaining a move caused by flooding needs a heading about relocation, not ticket prices.',
  ],
  [
    'listening_distractors',
    'listening',
    'Follow corrections',
    'Keep the final confirmed detail.',
    'The first detail may be corrected later.',
    'Listen for correction signals such as actually, instead and sorry. Replace the earlier detail.',
    'Monday—sorry, Tuesday → Tuesday is the final answer.',
  ],
  [
    'listening_answer_limits',
    'listening',
    'Accurate short answers',
    'Record the requested detail within the word limit.',
    'An extra word or wrong number can invalidate an answer.',
    'Read the instruction. Identify the answer type. Check spelling and the final number.',
    'Write ONE NUMBER: The charge is twenty pounds → 20.',
  ],
  [
    'listening_paraphrase',
    'listening',
    'Listen for meaning',
    'Connect an explanation to its concise meaning.',
    'Audio and options rarely repeat every word.',
    'Identify the speaker’s purpose and match the complete meaning.',
    'You can use our tools without buying them → equipment is provided.',
  ],
  [
    'writing_paragraph_support',
    'writing',
    'Develop a supported paragraph',
    'Connect a claim to a reason and a concrete example.',
    'Repeating a claim does not explain it.',
    'State the idea, explain why it matters, and demonstrate the same reason with an example.',
    'Evening opening helps workers. They can visit after work. For example, a nurse finishing at six can arrive at seven.',
  ],
  [
    'writing_cohesion',
    'writing',
    'Connect ideas logically',
    'Order ideas so each sentence builds on the previous one.',
    'Adding however does not create a real contrast.',
    'Introduce the claim before its explanation. Put an example after the reason it illustrates.',
    'Claim → reason → example. Use contrast language only when the next idea actually contrasts.',
  ],
  [
    'writing_task1_overview',
    'writing',
    'Write a clear overview',
    'Describe the main pattern without inventing a cause.',
    'Listing every value hides the overall picture.',
    'Compare the start and finish, identify the main trend and contrast, and keep causes out unless shown.',
    'If rail rises and car use falls, summarise that contrast; do not invent a new transport policy.',
  ],
  [
    'speaking_answer_extension',
    'speaking',
    'Extend a relevant answer',
    'Add a reason and a relevant detail to a direct answer.',
    'Speaking longer is not useful when the answer goes off topic.',
    'Answer directly, explain why, then add one relevant example.',
    'Do you use libraries? Yes, because I need a quiet place. I usually read there after work.',
  ],
  [
    'speaking_organisation',
    'speaking',
    'Organise a longer answer',
    'Give your listener an easy sequence to follow.',
    'Memorised connectors cannot replace a clear sequence.',
    'Introduce the subject, explain the reason or sequence, and finish with a relevant detail.',
    'Describe a useful service: name it → explain its use → give a personal example.',
  ],
  [
    'speaking_paraphrasing',
    'speaking',
    'Paraphrase naturally',
    'Explain an idea accurately using familiar language.',
    'An impressive synonym can change the meaning.',
    'Keep the same claim and qualifiers. Explain an unfamiliar word simply instead of guessing.',
    'Equipment is available to borrow → you can use the equipment and return it later.',
  ],
];
function choice(id, prompt, options, answer, explanation, extra = {}) {
  const offset = Number(id.match(/\d+$/)?.[0] || 0) % options.length;
  const rotated = [...options.slice(offset), ...options.slice(0, offset)];
  return {
    id,
    kind: 'choice',
    prompt,
    options: rotated,
    answer,
    explanation,
    hint: 'Compare every detail with the lesson strategy.',
    ...extra,
  };
}
export const skillLabLessons = definitions.map(
  ([skill, module, title, outcome, trap, strategy, example]) => {
    const items = situations.map(([topic, passage, statement, classification, paraphrase], i) => {
      const id = `${skill}-${i}`;
      const [course, earlier, final, price, equipment] = bookings[i];
      const [claim, reason, detail] = argumentsData[i];
      if (skill === 'reading_true_false_not_given')
        return choice(
          id,
          statement,
          ['True', 'False', 'Not Given'],
          classification,
          classification === 'Not Given'
            ? 'The passage does not establish or contradict this detail. Missing information is not a contradiction.'
            : `The passage ${classification === 'True' ? 'supports' : 'contradicts'} the statement: ${passage}`,
          {
            passage,
            evidence: [passage, 'Information absent'],
            evidence_answer: classification === 'Not Given' ? 'Information absent' : passage,
          }
        );
      if (skill === 'reading_paraphrase_matching' || skill === 'speaking_paraphrasing')
        return choice(
          id,
          'Which phrase preserves the meaning?',
          [
            paraphrase,
            `the complete closure of the ${topic}`,
            `an increase in prices at the ${topic}`,
          ],
          paraphrase,
          `“${paraphrase}” preserves what the text states without adding a closure or a price change.`,
          { passage }
        );
      if (skill === 'reading_matching_headings')
        return choice(
          id,
          'Choose the heading covering this paragraph.',
          [paraphrase, 'The history of ticket prices', 'Plans for overseas expansion'],
          paraphrase,
          `The paragraph focuses on ${paraphrase}. The other headings introduce topics the paragraph does not discuss.`,
          { passage: `${passage} This is the main update in the latest local notice.` }
        );
      if (module === 'listening') {
        const transcript =
          skill === 'listening_paraphrase'
            ? `For the ${course} session, you do not need to buy a ${equipment}. You can use one of ours during the session and give it back afterwards.`
            : `Here are the details for ${course}. We first advertised ${earlier}, but the session has moved to ${final}. The fee is ${price} pounds, including materials. Please bring your ${equipment}.`;
        const extra = { transcript, audio: `/audio/skill-lab/${id}.mp3` };
        if (skill === 'listening_answer_limits')
          return {
            id,
            kind: 'short',
            prompt: 'What is the fee in pounds? Write ONE NUMBER.',
            answer: price,
            explanation: `The final fee is ${price} pounds. The instruction asks for a number only.`,
            hint: 'Listen for the fee, not the day or the equipment.',
            ...extra,
          };
        const opts =
          skill === 'listening_paraphrase'
            ? [
                'Equipment can be borrowed',
                'Equipment must be purchased',
                'Equipment cannot be used',
              ]
            : [earlier, final, 'No day is confirmed'];
        const answer = skill === 'listening_paraphrase' ? opts[0] : final;
        return choice(
          id,
          skill === 'listening_paraphrase'
            ? 'What does the speaker say about equipment?'
            : 'On which day will the session take place?',
          opts,
          answer,
          skill === 'listening_paraphrase'
            ? 'Use and give back describes borrowing, not purchasing.'
            : `The earlier day is corrected: the final arrangement is ${final}.`,
          extra
        );
      }
      if (skill === 'writing_task1_overview') {
        const a = 12 + i,
          b = 34 + i,
          c = 54 - i,
          d = 28 - Math.floor(i / 2);
        return choice(
          id,
          'Choose an accurate overview of the two changes.',
          [
            'Use of A rose, while use of B fell.',
            'Both categories rose over the period.',
            'A rose because prices fell.',
          ],
          'Use of A rose, while use of B fell.',
          'A increases and B decreases. No reason for either change is provided.',
          {
            passage: `Travel survey ${2000 + i}–${2005 + i}: category A changes from ${a}% to ${b}%; category B changes from ${c}% to ${d}%.`,
          }
        );
      }
      if (skill === 'writing_cohesion' || skill === 'speaking_organisation')
        return {
          id,
          kind: 'order',
          prompt: 'Put the claim, reason and example in a logical order.',
          options: [detail, claim, reason],
          answer: [claim, reason, detail],
          explanation:
            'The claim introduces the subject. The reason explains it. The example illustrates that reason.',
          hint: 'Introduce the idea before explaining or illustrating it.',
        };
      return choice(
        id,
        'Which sentence best develops this idea?',
        [
          reason,
          'This is an important issue and it is very important.',
          'There are many different things in the world.',
        ],
        reason,
        `The reason explains the claim directly. A useful supporting example is: ${detail}`,
        { passage: claim }
      );
    });
    return {
      skill,
      module,
      title,
      outcome,
      trap,
      strategy,
      example,
      version: 1,
      basic: true,
      estimated_minutes: 8,
      open_prompt: ['writing', 'speaking'].includes(module)
        ? `Practise ${title.toLowerCase()}. ${module === 'speaking' ? 'Describe a useful local service. Give a relevant reason and example.' : 'Write two or three sentences about a useful local service, applying this lesson.'}`
        : null,
      items: items.map((item, i) => ({ ...item, stage: i < 4 ? 'guided' : 'independent' })),
    };
  }
);
