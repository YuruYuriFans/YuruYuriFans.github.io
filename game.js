// Game State
let gameState = {
    players: [],
    currentTurn: null,
    currentPhase: null,
    rpsChoices: {},
    combatLog: [],
    selectedCharacter: null,
    selectedPassive: null,
    selectedFaction: null,
    gameLength: 5
};

// Initialize Setup Screen
function initSetup() {
    const grid = document.getElementById('characterGrid');
    grid.innerHTML = '';
    
    Object.values(CHARACTERS).forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <h3>${char.name} (${char.code})</h3>
            <div class="stat-line">HP: ${char.maxHP} | MP: ${char.maxMP} | Shield: ${char.maxShield}</div>
            <div class="stat-line">Value: ${char.valueTag} | Groups: ${char.groupTags.join(', ')}</div>
            <div style="margin-top: 10px; font-size: 11px; color: #888;">${char.description}</div>
            <div style="margin-top: 10px;">
                <div style="font-size: 11px; color: #4a9eff; margin-bottom: 5px;">Active Skills:</div>
                ${char.activeSkills.map(s => `<div class="skill-item">${s.name} (CD:${s.cooldown}, MP:${s.mpCost})</div>`).join('')}
            </div>
        `;
        card.onclick = (event) => selectCharacter(char.code, event);
        grid.appendChild(card);
    });
    
    // Faction buttons
    document.querySelectorAll('.faction-btn').forEach(btn => {
        btn.onclick = () => selectFaction(btn.dataset.faction);
    });
    
    document.getElementById('startBtn').onclick = startGame;
}

function selectCharacter(code, event) {
    gameState.selectedCharacter = code;
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.character-card').classList.add('selected');
    
    // Show passive selection
    const char = CHARACTERS[code];
    const passiveDiv = document.getElementById('passiveSelect');
    const optionsDiv = document.getElementById('passiveOptions');
    passiveDiv.classList.remove('hidden');
    optionsDiv.innerHTML = '';
    
    char.passiveSkills.forEach((passive, idx) => {
        const option = document.createElement('div');
        option.className = 'passive-option';
        option.innerHTML = `<strong>${passive.name}</strong><br>${passive.description}`;
        option.onclick = () => selectPassive(idx);
        optionsDiv.appendChild(option);
    });
    
    updateStartButton();
}

function selectPassive(idx) {
    gameState.selectedPassive = idx;
    document.querySelectorAll('.passive-option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === idx);
    });
    updateStartButton();
}

function selectFaction(faction) {
    gameState.selectedFaction = parseInt(faction);
    document.querySelectorAll('.faction-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.faction === faction);
    });
    updateStartButton();
}

function updateStartButton() {
    const btn = document.getElementById('startBtn');
    btn.disabled = !(gameState.selectedCharacter && gameState.selectedPassive !== null && gameState.selectedFaction);
}

function startGame() {
    // Create players
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const otherChars = Object.values(CHARACTERS).filter(c => c.code !== gameState.selectedCharacter);
    
    // Shuffle and pick 3 AI characters
    const aiChars = otherChars.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Create player
    gameState.players = [
        createPlayer(playerChar, true, gameState.selectedFaction, gameState.selectedPassive)
    ];
    
    // Create AI players (distribute factions)
    const factions = [1, 1, 2, 2].filter(f => f !== gameState.selectedFaction);
    aiChars.forEach((char, idx) => {
        const faction = idx < factions.length ? factions[idx] : (Math.random() > 0.5 ? 1 : 2);
        const passiveIdx = Math.floor(Math.random() * char.passiveSkills.length);
        gameState.players.push(createPlayer(char, false, faction, passiveIdx));
    });
    
    // Switch to game screen
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    
    renderGame();
    addLog('Game started!', 'system');
    startRPSRound();
}

function createPlayer(character, isPlayer, faction, passiveIdx) {
    return {
        id: Math.random().toString(36).substr(2, 9),
        character: character,
        isPlayer: isPlayer,
        faction: faction,
        hp: character.maxHP,
        mp: character.maxMP,
        shield: character.maxShield,
        cards: [],
        spells: [],
        cooldowns: {},
        reserves: {},
        passiveSkill: character.passiveSkills[passiveIdx],
        alive: true
    };
}

function renderGame() {
    renderOpponents();
    renderPlayer();
}

function renderOpponents() {
    const grid = document.getElementById('opponentsGrid');
    grid.innerHTML = '';
    
    const opponents = gameState.players.filter(p => !p.isPlayer);
    opponents.forEach(player => {
        grid.appendChild(createCharPanel(player));
    });
}

function renderPlayer() {
    const info = document.getElementById('playerInfo');
    const player = gameState.players.find(p => p.isPlayer);
    if (!player) return;
    
    info.innerHTML = '';
    info.appendChild(createCharPanel(player));
    renderPlayerSkills();
}

function createCharPanel(player) {
    const panel = document.createElement('div');
    panel.className = 'char-panel';
    if (gameState.currentTurn?.id === player.id) {
        panel.classList.add('active-turn');
    }
    if (!player.alive) {
        panel.classList.add('dead');
    }
    
    const hpPercent = (player.hp / player.character.maxHP) * 100;
    const mpPercent = (player.mp / player.character.maxMP) * 100;
    const shieldPercent = (player.shield / player.character.maxShield) * 100;
    
    panel.innerHTML = `
        <div class="char-header">
            <div class="char-name">${player.character.name} ${player.isPlayer ? '(YOU)' : ''}</div>
            <div class="faction-badge">Faction ${player.faction}</div>
        </div>
        <div class="stat-bars">
            <div class="stat-bar">
                <div class="stat-bar-label">HP</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill hp" style="width: ${hpPercent}%"></div>
                    <div class="stat-bar-text">${player.hp} / ${player.character.maxHP}</div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-label">MP</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill mp" style="width: ${mpPercent}%"></div>
                    <div class="stat-bar-text">${player.mp.toFixed(1)} / ${player.character.maxMP}</div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-label">Shield</div>
                <div class="stat-bar-container">
                    <div class="stat-bar-fill shield" style="width: ${shieldPercent}%"></div>
                    <div class="stat-bar-text">${player.shield} / ${player.character.maxShield}</div>
                </div>
            </div>
        </div>
        <div class="char-details">
            <div class="detail-row">
                <span style="color: #888;">Passive:</span>
                <span title="${player.passiveSkill.description}">${player.passiveSkill.name}</span>
            </div>
        </div>
        ${player.cards.length > 0 ? `
            <div class="cards-row">
                <strong>Cards:</strong> ${player.cards.map(c => `<span class="card-chip">${c.toUpperCase()}</span>`).join('')}
            </div>
        ` : ''}
        ${player.spells.length > 0 ? `
            <div class="spells-row">
                <strong>Spells:</strong> ${player.spells.map(s => `<span class="spell-chip" title="${s.type}">${s.type}</span>`).join('')}
            </div>
        ` : ''}
        ${player.isPlayer ? `
            <div style="margin-top: 10px; padding: 8px; background: #1a1a1a; font-size: 11px;">
                ${player.character.activeSkills.map(skill => {
                    const cd = player.cooldowns[skill.code] || 0;
                    const reserves = player.reserves[skill.code] ?? gameState.gameLength;
                    return `
                        <div style="display: flex; justify-content: space-between; margin: 3px 0; padding: 3px; background: #252525;">
                            <span>${skill.name}</span>
                            <span style="color: ${cd === 0 ? '#51cf66' : '#ff6b6b'};">CD: ${cd} | Uses: ${reserves}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : ''}
    `;
    
    return panel;
}

function renderPlayerSkills() {
    const player = gameState.players.find(p => p.isPlayer);
    if (!player || !gameState.currentTurn || gameState.currentTurn.id !== player.id) {
        document.getElementById('skillsGrid').innerHTML = '<p style="text-align: center; color: #888;">Waiting for your turn...</p>';
        return;
    }
    
    const phase = gameState.currentPhase;
    const availableSkills = player.character.activeSkills.filter(skill => {
        if (skill.phase !== phase) return false;
        const cd = player.cooldowns[skill.code] || 0;
        const reserves = player.reserves[skill.code] ?? gameState.gameLength;
        return cd === 0 && reserves > 0 && player.mp >= skill.mpCost;
    });
    
    const grid = document.getElementById('skillsGrid');
    grid.innerHTML = '';
    
    // Skip button
    const skipBtn = document.createElement('div');
    skipBtn.className = 'skill-card';
    skipBtn.innerHTML = `
        <div class="skill-card-name">SKIP PHASE</div>
        <div class="skill-card-stats">Continue to next phase</div>
    `;
    skipBtn.onclick = () => continuePhase();
    grid.appendChild(skipBtn);
    
    // Add all skills
    player.character.activeSkills.forEach(skill => {
        const cd = player.cooldowns[skill.code] || 0;
        const reserves = player.reserves[skill.code] ?? gameState.gameLength;
        const canUse = availableSkills.includes(skill);
        
        const card = document.createElement('div');
        card.className = 'skill-card' + (canUse ? '' : ' disabled');
        card.innerHTML = `
            <div class="skill-card-name">${skill.name}</div>
            <div class="skill-card-stats">
                <div class="skill-card-stat">Phase: ${skill.phase}</div>
                <div class="skill-card-stat">MP: ${skill.mpCost}</div>
                <div class="skill-card-stat">CD: ${cd}</div>
                <div class="skill-card-stat">Uses: ${reserves}</div>
            </div>
            <div class="tooltip">
                ${skill.description}<br>
                <strong>Cooldown:</strong> ${skill.cooldown}<br>
                <strong>MP Cost:</strong> ${skill.mpCost}
            </div>
        `;
        
        if (canUse) {
            card.onclick = () => useSkill(skill);
        }
        
        grid.appendChild(card);
    });
}

function startRPSRound() {
    const alivePlayers = gameState.players.filter(p => p.alive);
    if (checkVictory()) return;
    
    gameState.rpsChoices = {};
    gameState.rpsActive = alivePlayers.map(p => p.id);
    
    addLog('=== RPS Round Started ===', 'rps');
    
    // ALL players (including AI) make choices simultaneously but hidden
    alivePlayers.forEach(player => {
        if (!player.isPlayer) {
            const choices = ['rock', 'paper', 'scissors'];
            const weights = [Math.random(), Math.random(), Math.random()];
            const maxWeight = Math.max(...weights);
            const choiceIndex = weights.indexOf(maxWeight);
            gameState.rpsChoices[player.id] = choices[choiceIndex];
        }
    });
    
    // Show modal for player
    const modal = document.getElementById('rpsModal');
    modal.classList.remove('hidden');
    document.getElementById('rpsWaiting').classList.add('hidden');
    document.getElementById('rpsResults').classList.add('hidden');
    
    document.querySelectorAll('.rps-btn').forEach(btn => {
        btn.onclick = () => playerRPSChoice(btn.dataset.choice);
    });
}

function playerRPSChoice(choice) {
    const player = gameState.players.find(p => p.isPlayer && p.alive);
    gameState.rpsChoices[player.id] = choice;
    
    // Disable buttons
    document.querySelectorAll('.rps-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
    
    addLog(`You chose ${choice}`, 'rps');
    
    // Now reveal all choices
    setTimeout(() => {
        displayRPSResults();
        setTimeout(() => resolveRPS(), 2000);
    }, 500);
}

function displayRPSResults() {
    const resultsDiv = document.getElementById('rpsResults');
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '<h3 style="margin-bottom: 10px; color: #4a9eff;">Round Results:</h3>';
    
    gameState.players.filter(p => p.alive).forEach(player => {
        const choice = gameState.rpsChoices[player.id];
        const isActive = gameState.rpsActive.includes(player.id);
        const item = document.createElement('div');
        item.className = 'rps-result-item' + (isActive ? '' : ' eliminated');
        item.innerHTML = `
            <span>${player.character.name}</span>
            <span style="font-weight: bold;">${choice ? choice.toUpperCase() : '???'}</span>
        `;
        resultsDiv.appendChild(item);
    });
}

function resolveRPS() {
    let activeIds = [...gameState.rpsActive];
    let iterations = 0;
    const maxIterations = 20;
    
    while (activeIds.length > 1 && iterations < maxIterations) {
        iterations++;
        
        const activeChoices = activeIds.map(id => gameState.rpsChoices[id]);
        const uniqueChoices = [...new Set(activeChoices)];
        
        if (uniqueChoices.length === 1 || uniqueChoices.length === 3) {
            addLog('Tie! Re-throwing...', 'rps');
            
            // Re-choose for everyone
            activeIds.forEach(playerId => {
                const choices = ['rock', 'paper', 'scissors'];
                const weights = [Math.random(), Math.random(), Math.random()];
                const maxWeight = Math.max(...weights);
                const choiceIndex = weights.indexOf(maxWeight);
                gameState.rpsChoices[playerId] = choices[choiceIndex];
            });
            
            displayRPSResults();
            continue;
        }
        
        // Two choices - eliminate losers
        const winners = determineRPSWinners(activeIds);
        addLog(`${winners.map(id => gameState.players.find(p => p.id === id).character.name).join(', ')} advance`, 'rps');
        
        gameState.rpsActive = winners;
        activeIds = winners;
        displayRPSResults();
        
        if (activeIds.length === 1) break;
        
        // Re-choose for winners
        activeIds.forEach(playerId => {
            const choices = ['rock', 'paper', 'scissors'];
            const weights = [Math.random(), Math.random(), Math.random()];
            const maxWeight = Math.max(...weights);
            const choiceIndex = weights.indexOf(maxWeight);
            gameState.rpsChoices[playerId] = choices[choiceIndex];
        });
        
        displayRPSResults();
    }
    
    if (iterations >= maxIterations) {
        const winnerId = activeIds[Math.floor(Math.random() * activeIds.length)];
        activeIds = [winnerId];
        addLog('Tie limit reached, random winner selected', 'rps');
    }
    
    // Winner
    const winnerId = activeIds[0];
    const winner = gameState.players.find(p => p.id === winnerId);
    const winnerChoice = gameState.rpsChoices[winnerId];
    winner.cards.push(winnerChoice);
    addLog(`${winner.character.name} wins! Card: ${winnerChoice}`, 'rps');
    
    setTimeout(() => {
        document.getElementById('rpsModal').classList.add('hidden');
        // Re-enable buttons for next round
        document.querySelectorAll('.rps-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
        renderGame();
        startTurn(winner);
    }, 2000);
}

function determineRPSWinners(activeIds) {
    const choiceMap = {};
    activeIds.forEach(id => {
        const choice = gameState.rpsChoices[id];
        if (!choiceMap[choice]) choiceMap[choice] = [];
        choiceMap[choice].push(id);
    });
    
    const choices = Object.keys(choiceMap);
    if (choices.length !== 2) return activeIds;
    
    const [c1, c2] = choices;
    const winningChoice = getWinningChoice(c1, c2);
    return choiceMap[winningChoice];
}

function getWinningChoice(c1, c2) {
    if (c1 === 'rock' && c2 === 'scissors') return 'rock';
    if (c1 === 'scissors' && c2 === 'rock') return 'rock';
    if (c1 === 'paper' && c2 === 'rock') return 'paper';
    if (c1 === 'rock' && c2 === 'paper') return 'paper';
    if (c1 === 'scissors' && c2 === 'paper') return 'scissors';
    if (c1 === 'paper' && c2 === 'scissors') return 'scissors';
    return c1;
}

async function startTurn(player) {
    gameState.currentTurn = player;
    addLog(`=== ${player.character.name}'s Turn ===`, 'system');
    renderGame();
    
    await executePhases(player);
}

async function executePhases(player) {
    const phases = ['initialization', 'pre-execution', 'execution', 'post-execution', 'finalization'];
    
    for (const phase of phases) {
        gameState.currentPhase = phase;
        await executePhase(player, phase);
    }
    
    addLog(`Turn ended`, 'system');
    gameState.currentTurn = null;
    gameState.currentPhase = null;
    renderGame();
    
    setTimeout(() => startRPSRound(), 1000);
}

async function executePhase(player, phase) {
    addLog(`Phase: ${phase}`, 'system');
    document.getElementById('phaseIndicator').textContent = phase.toUpperCase();
    
    if (phase === 'pre-execution') {
        player.mp = Math.min(player.mp + 0.5, player.character.maxMP);
        addLog(`${player.character.name} gains 0.5 MP`, 'system');
        renderGame();
    }
    
    if (phase !== 'initialization' && phase !== 'finalization') {
        await useSkillInPhase(player, phase);
    }
    
    if (phase === 'finalization') {
        Object.keys(player.cooldowns).forEach(skillCode => {
            if (player.cooldowns[skillCode] > 0) {
                player.cooldowns[skillCode]--;
            }
        });
        renderGame();
    }
}

function useSkillInPhase(player, phase) {
    const availableSkills = player.character.activeSkills.filter(skill => {
        if (skill.phase !== phase) return false;
        const cd = player.cooldowns[skill.code] || 0;
        const reserves = player.reserves[skill.code] ?? gameState.gameLength;
        return cd === 0 && reserves > 0 && player.mp >= skill.mpCost;
    });
    
    if (availableSkills.length === 0) {
        addLog(`No skills available in ${phase}`, 'system');
        return Promise.resolve();
    }
    
    if (player.isPlayer) {
        return playerChooseSkill(player, availableSkills);
    } else {
        return aiChooseSkill(player, availableSkills);
    }
}

function playerChooseSkill(player, skills) {
    return new Promise((resolve) => {
        gameState.phaseResolve = resolve;
        renderPlayerSkills();
    });
}

function continuePhase() {
    if (gameState.phaseResolve) {
        gameState.phaseResolve();
        gameState.phaseResolve = null;
    }
}

async function aiChooseSkill(player, skills) {
    const isAttack = Math.random() < 0.7;
    const filtered = skills.filter(s => {
        const isAttackSkill = s.targetType === 'enemy';
        return isAttack ? isAttackSkill : !isAttackSkill;
    });
    
    const chosen = filtered.length > 0 ? 
        filtered[Math.floor(Math.random() * filtered.length)] :
        skills[Math.floor(Math.random() * skills.length)];
    
    await useSkill(chosen, player);
    
    // For AI, force phase continuation after action
    if (gameState.phaseResolve) {
        gameState.phaseResolve();
        gameState.phaseResolve = null;
    }
}

async function useSkill(skill, user) {
    if (!user) user = gameState.players.find(p => p.isPlayer);
    
    addLog(`${user.character.name} uses ${skill.name}`, 'system');
    
    user.mp -= skill.mpCost;
    user.cooldowns[skill.code] = skill.cooldown;
    
    if (!user.reserves[skill.code]) user.reserves[skill.code] = gameState.gameLength;
    user.reserves[skill.code]--;
    
    Object.keys(user.cooldowns).forEach(code => {
        if (code !== skill.code && user.cooldowns[code] > 0) {
            user.cooldowns[code]--;
        }
    });
    
    renderGame();
    
    let targets = [];
    if (skill.targetCount === 0) {
        targets = [user];
    } else if (skill.targetCount === 'all') {
        targets = gameState.players.filter(p => p.alive && p.id !== user.id && p.faction !== user.faction); // Assuming 'all' targets enemies
    } else {
        targets = await selectTargets(user, skill);
    }
    
    const result = skill.effect(targets, user);
    await applyEffect(result, user);
    
    if (user.isPlayer && gameState.phaseResolve) {
        // Player's turn is resolved in applyEffect or in the promise chain of selectTargets
        // The playerChooseSkill function handles the flow control for the player
    }
}

function selectTargets(player, skill) {
    return new Promise((resolve) => {
        if (!player.isPlayer) {
            const eligible = gameState.players.filter(p => {
                if (!p.alive) return false;
                if (skill.targetType === 'enemy') return p.faction !== player.faction;
                if (skill.targetType === 'ally') return p.faction === player.faction;
                return true;
            });
            
            const selected = [];
            
            // AI Target Selection Logic
            if (eligible.length > 0) {
                const count = skill.targetCount === 'all' ? eligible.length : Math.min(skill.targetCount, eligible.length);
                
                // Simple AI: prioritize low HP enemies or low HP allies for heals
                const sortedEligible = eligible.sort((a, b) => {
                    const hpA = a.hp / a.character.maxHP;
                    const hpB = b.hp / b.character.maxHP;
                    
                    if (skill.targetType === 'enemy') {
                        return hpA - hpB; // Prioritize lower HP enemy
                    } else if (skill.targetType === 'ally') {
                        return hpA - hpB; // Prioritize lower HP ally (needs healing)
                    }
                    return 0;
                });
                
                for (let i = 0; i < count; i++) {
                    // Simple selection for now, just take the top 'count' targets
                    if (sortedEligible[i]) {
                        selected.push(sortedEligible[i]);
                    }
                }
            }
            
            resolve(selected);
            return;
        }
        
        const modal = document.getElementById('targetModal');
        const grid = document.getElementById('targetGrid');
        modal.classList.remove('hidden');
        grid.innerHTML = '';
        
        const selectedTargets = [];
        
        const eligible = gameState.players.filter(p => {
            if (!p.alive) return false;
            if (skill.targetType === 'enemy') return p.faction !== player.faction;
            if (skill.targetType === 'ally') return p.faction === player.faction;
            if (skill.targetType === 'self') return p.id === player.id;
            return true;
        });
        
        eligible.forEach(target => {
            const card = document.createElement('div');
            card.className = 'target-card';
            card.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">${target.character.name} (HP: ${target.hp}/${target.character.maxHP})</div>
                <div style="font-size: 11px;">Faction: ${target.faction}</div>
                <div style="font-size: 11px;">Shield: ${target.shield}/${target.character.maxShield}</div>
            `;
            card.onclick = () => {
                const index = selectedTargets.indexOf(target);
                if (index !== -1) {
                    selectedTargets.splice(index, 1);
                    card.classList.remove('selected');
                } else if (skill.targetCount === 1) {
                    // Single target: clear others
                    document.querySelectorAll('.target-card').forEach(c => c.classList.remove('selected'));
                    selectedTargets.length = 0;
                    selectedTargets.push(target);
                    card.classList.add('selected');
                } else if (selectedTargets.length < skill.targetCount || skill.targetCount === 'all') {
                    selectedTargets.push(target);
                    card.classList.add('selected');
                }
            };
            grid.appendChild(card);
        });
        
        document.getElementById('confirmTargetBtn').onclick = () => {
            if (selectedTargets.length > 0) {
                modal.classList.add('hidden');
                resolve(selectedTargets);
            } else {
                alert('Please select a target.');
            }
        };
    });
}

async function applyEffect(effect, user) {
    if (effect.type === 'physical' || effect.type === 'magical') {
        for (const target of effect.targets) {
            let damage = effect.damage;
            
            const evade = target.spells.find(s => s.type === 'evade_next');
            if (evade) {
                addLog(`${target.character.name} evaded!`, 'system');
                target.spells = target.spells.filter(s => s !== evade);
                continue;
            }
            
            if (effect.type === 'physical') {
                const shieldDamage = Math.min(target.shield, damage);
                target.shield -= shieldDamage;
                damage -= shieldDamage;
                
                if (damage > 0) {
                    target.hp -= damage;
                    addLog(`${target.character.name} takes ${damage} physical (${shieldDamage} blocked)`, 'damage');
                } else {
                    addLog(`${target.character.name}'s shield blocks ${shieldDamage}`, 'system');
                }
            } else {
                // Magical damage ignores shield in this implementation
                target.hp -= damage;
                addLog(`${target.character.name} takes ${damage} magical`, 'damage');
            }
            
            if (target.hp <= 0) {
                target.hp = 0;
                target.alive = false;
                addLog(`${target.character.name} defeated!`, 'damage');
            }
            
            // Passive Skill: MP Drain
            if (user.passiveSkill.code === 'YRYR_00_P1') {
                target.mp = Math.max(0, target.mp - 1);
                addLog(`${target.character.name} loses 1 MP`, 'system');
            }
            
            // Passive Skill: Burn
            if (effect.type === 'magical' && user.passiveSkill.code === 'TEST_01_P1') {
                 target.spells.push({ type: 'burn', positive: false, damage: 1, duration: 1 });
                 addLog(`${target.character.name} is burning (1 damage next turn)`, 'spell');
            }
        }
    } else if (effect.type === 'heal') {
        for (const target of effect.targets) {
            const healed = Math.min(effect.amount, target.character.maxHP - target.hp);
            target.hp += healed;
            addLog(`${target.character.name} recovers ${healed} HP`, 'heal');
        }
    } else if (effect.type === 'shield') {
        for (const target of effect.targets) {
            const added = Math.min(effect.amount, target.character.maxShield - target.shield);
            target.shield += added;
            addLog(`${target.character.name} gains ${added} shield`, 'system');
        }
    } else if (effect.type === 'spell') {
        for (const target of effect.targets) {
            target.spells.push(effect.spell);
            addLog(`${target.character.name} receives: ${effect.spell.type}`, 'spell');
        }
    }
    
    renderGame();
}

function checkVictory() {
    const factions = {};
    gameState.players.filter(p => p.alive).forEach(p => {
        if (!factions[p.faction]) factions[p.faction] = [];
        factions[p.faction].push(p);
    });
    
    const aliveFactions = Object.keys(factions);
    if (aliveFactions.length <= 1) { // Check if only one or zero factions remain
        if (aliveFactions.length === 1) {
            const winner = aliveFactions[0];
            addLog(`=== FACTION ${winner} WINS! ===`, 'system');
            
            const playerWon = factions[winner].some(p => p.isPlayer);
            if (playerWon) {
                addLog('YOU WIN!', 'heal');
            } else {
                addLog('YOU LOSE!', 'damage');
            }
        } else {
            addLog('=== STALEMATE: ALL PLAYERS DEFEATED ===', 'system');
        }
        
        // Prevent further RPS rounds
        document.getElementById('rpsModal').classList.add('hidden');
        document.getElementById('gameScreen').style.opacity = '0.5';
        
        return true;
    }
    return false;
}

function addLog(message, type = 'system') {
    const log = document.getElementById('combatLog');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Start the setup when the script loads
document.addEventListener('DOMContentLoaded', initSetup);