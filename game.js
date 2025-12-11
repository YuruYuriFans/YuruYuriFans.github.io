class Skill {
  constructor(name, damage, heal, cooldown) {
    this.name = name;
    this.damage = damage;
    this.heal = heal;
    this.maxCooldown = cooldown;
    this.currentCooldown = 0;
  }

  ready() {
    return this.currentCooldown === 0;
  }

  use() {
    this.currentCooldown = this.maxCooldown;
  }

  tick() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }
}

class Entity {
  constructor(name) {
    this.name = name;
    this.hp = 5;
    this.mp = 3;
    this.skills = [
      new Skill("Normal Attack", 1, 0, 0),
      new Skill("Heavy Strike", 4, 0, 1),
      new Skill("Heal", 0, 5, 2),
      new Skill("Empty Skill", 0, 0, 0),
    ];
  }

  alive() {
    return this.hp > 0;
  }

  reduceCooldowns() {
    this.skills.forEach(s => s.tick());
  }
}

class Game {
  constructor() {
    this.player = new Entity("Player");
    this.enemy  = new Entity("Enemy");
    this.updateUI();
  }

  playerChoose(choice) {
    const options = ["rock", "paper", "scissors"];
    const enemyChoice = options[Math.floor(Math.random() * 3)];

    let result = this.checkRPS(choice, enemyChoice);

    let text = `You chose ${choice}, enemy chose ${enemyChoice}.`;

    if (result === "win") {
      text += " You win! Use a skill.";
      document.getElementById("skillSection").style.display = "block";
    } else if (result === "lose") {
      text += " You lose! Enemy attacks.";
      this.enemyAttack();
    } else {
      text += " Draw! No one acts.";
    }

    this.endTurn(text);
  }

  checkRPS(p, e) {
    if (p === e) return "draw";
    if (
      (p === "rock" && e === "scissors") ||
      (p === "paper" && e === "rock") ||
      (p === "scissors" && e === "paper")
    ) {
      return "win";
    }
    return "lose";
  }

  useSkill(skillIndex) {
    const sk = this.player.skills[skillIndex];

    if (!sk.ready()) {
      alert("Skill on cooldown!");
      return;
    }

    // apply skill effect
    if (sk.damage > 0) {
      this.enemy.hp -= sk.damage;
    }
    if (sk.heal > 0) {
      this.player.hp += sk.heal;
    }

    sk.use();
    document.getElementById("skillSection").style.display = "none";

    this.endTurn(`Used ${sk.name}!`);
  }

  enemyAttack() {
    const dmg = 1;
    this.player.hp -= dmg;
  }

  endTurn(message) {
    // reduce cooldowns
    this.player.reduceCooldowns();
    this.enemy.reduceCooldowns();

    // check end
    if (!this.player.alive()) {
      message += `<br><br>💀 You died. Game Over.`;
    }
    if (!this.enemy.alive()) {
      message += `<br><br>🎉 Enemy defeated!`;
    }

    this.updateUI(message);
  }

  updateUI(msg = "") {
    const p = this.player;
    const e = this.enemy;

    document.getElementById("status").innerHTML = `
      <strong>Player:</strong> HP ${p.hp}, MP ${p.mp}<br>
      <strong>Enemy:</strong> HP ${e.hp}, MP ${e.mp}<br><br>
      ${msg}
    `;
  }
}

const game = new Game();
