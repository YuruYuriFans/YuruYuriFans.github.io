// Game Data
const CHARACTERS = {
    'YRYR_00': {
        code: 'YRYR_00',
        name: 'Akari',
        maxHP: 5,
        maxMP: 5,
        maxShield: 5,
        valueTag: 'order',
        groupTags: ['warrior'],
        description: 'Balanced fighter with evasion support',
        activeSkills: [
            {
                code: 'YRYR_00_01',
                name: 'Double Strike',
                phase: 'execution',
                cooldown: 3,
                mpCost: 0,
                targetCount: 2,
                targetType: 'enemy',
                description: 'Deal 2 physical damage to up to 2 targets',
                effect: (targets, user) => ({ type: 'physical', damage: 2, targets })
            },
            {
                code: 'YRYR_00_02',
                name: 'Heavy Blow',
                phase: 'execution',
                cooldown: 1,
                mpCost: 0,
                targetCount: 1,
                targetType: 'enemy',
                description: 'Deal 4 physical damage to 1 target',
                effect: (targets, user) => ({ type: 'physical', damage: 4, targets })
            },
            {
                code: 'YRYR_00_03',
                name: 'Evasion Ward',
                phase: 'execution',
                cooldown: 3,
                mpCost: 0,
                targetCount: 1,
                targetType: 'any',
                description: 'Target evades next attack',
                effect: (targets, user) => ({ type: 'spell', spell: { type: 'evade_next', positive: true }, targets })
            },
            {
                code: 'YRYR_00_04',
                name: 'Heal',
                phase: 'execution',
                cooldown: 2,
                mpCost: 0,
                targetCount: 1,
                targetType: 'any',
                description: 'Recover 5 HP',
                effect: (targets, user) => ({ type: 'heal', amount: 5, targets })
            }
        ],
        passiveSkills: [
            {
                code: 'YRYR_00_P1',
                name: 'MP Drain',
                description: 'Each non-evaded attack deals -1 MP to target'
            },
            {
                code: 'YRYR_00_P2',
                name: 'Crowd Immunity',
                description: 'If alive players > 3, cannot be selected by AOE'
            }
        ]
    },
    'TEST_01': {
        code: 'TEST_01',
        name: 'Blaze',
        maxHP: 5,
        maxMP: 5,
        maxShield: 5,
        valueTag: 'liberty',
        groupTags: ['mage'],
        description: 'Fire mage with strong AOE',
        activeSkills: [
            {
                code: 'TEST_01_01',
                name: 'Fireball',
                phase: 'execution',
                cooldown: 1,
                mpCost: 1,
                targetCount: 1,
                targetType: 'enemy',
                description: 'Deal 3 magical damage',
                effect: (targets, user) => ({ type: 'magical', damage: 3, targets })
            },
            {
                code: 'TEST_01_02',
                name: 'Fire Nova',
                phase: 'execution',
                cooldown: 3,
                mpCost: 2,
                targetCount: 'all',
                targetType: 'enemy',
                description: 'Deal 2 magical damage to all enemies',
                effect: (targets, user) => ({ type: 'magical', damage: 2, targets })
            },
            {
                code: 'TEST_01_03',
                name: 'Mana Shield',
                phase: 'pre-execution',
                cooldown: 2,
                mpCost: 1,
                targetCount: 0,
                targetType: 'self',
                description: 'Gain 3 shield',
                effect: (targets, user) => ({ type: 'shield', amount: 3, targets: [user] })
            }
        ],
        passiveSkills: [
            {
                code: 'TEST_01_P1',
                name: 'Burn',
                description: 'Magical attacks add burn spell (1 damage next turn)'
            }
        ]
    },
    'TEST_02': {
        code: 'TEST_02',
        name: 'Guardian',
        maxHP: 6,
        maxMP: 4,
        maxShield: 6,
        valueTag: 'equality',
        groupTags: ['tank'],
        description: 'High defense tank',
        activeSkills: [
            {
                code: 'TEST_02_01',
                name: 'Shield Slam',
                phase: 'execution',
                cooldown: 1,
                mpCost: 0,
                targetCount: 1,
                targetType: 'enemy',
                description: 'Deal 2 physical damage',
                effect: (targets, user) => ({ type: 'physical', damage: 2, targets })
            },
            {
                code: 'TEST_02_02',
                name: 'Fortify',
                phase: 'pre-execution',
                cooldown: 2,
                mpCost: 1,
                targetCount: 0,
                targetType: 'self',
                description: 'Gain 4 shield',
                effect: (targets, user) => ({ type: 'shield', amount: 4, targets: [user] })
            },
            {
                code: 'TEST_02_03',
                name: 'Taunt',
                phase: 'execution',
                cooldown: 3,
                mpCost: 0,
                targetCount: 1,
                targetType: 'enemy',
                description: 'Force target to attack you',
                effect: (targets, user) => ({ type: 'spell', spell: { type: 'forced_target', positive: false, target: user }, targets })
            }
        ],
        passiveSkills: [
            {
                code: 'TEST_02_P1',
                name: 'Regeneration',
                description: 'Recover 1 HP at start of turn'
            }
        ]
    },
    'TEST_03': {
        code: 'TEST_03',
        name: 'Shadow',
        maxHP: 4,
        maxMP: 6,
        maxShield: 4,
        valueTag: 'order',
        groupTags: ['assassin'],
        description: 'High damage dealer',
        activeSkills: [
            {
                code: 'TEST_03_01',
                name: 'Backstab',
                phase: 'execution',
                cooldown: 1,
                mpCost: 0,
                targetCount: 1,
                targetType: 'enemy',
                description: 'Deal 3 physical damage',
                effect: (targets, user) => ({ type: 'physical', damage: 3, targets })
            },
            {
                code: 'TEST_03_02',
                name: 'Poison Dart',
                phase: 'execution',
                cooldown: 3,
                mpCost: 1,
                targetCount: 1,
                targetType: 'enemy',
                description: 'Apply poison (2 damage over 2 turns)',
                effect: (targets, user) => ({ type: 'spell', spell: { type: 'poison', positive: false, damage: 2, duration: 2 }, targets })
            },
            {
                code: 'TEST_03_03',
                name: 'Vanish',
                phase: 'pre-execution',
                cooldown: 3,
                mpCost: 1,
                targetCount: 0,
                targetType: 'self',
                description: 'Evade next attack',
                effect: (targets, user) => ({ type: 'spell', spell: { type: 'evade_next', positive: true }, targets: [user] })
            }
        ],
        passiveSkills: [
            {
                code: 'TEST_03_P1',
                name: 'Critical Strike',
                description: '20% chance to deal double damage'
            }
        ]
    }
};