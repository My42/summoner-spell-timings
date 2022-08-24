import {
  OWGames,
  OWGamesEvents,
} from "@overwolf/overwolf-api-ts";


import { AppWindow } from "../AppWindow";
import { kWindowNames, kGamesFeatures, summonerSpellCooldown } from "../consts";

class InGame extends AppWindow {
  private static _instance: InGame;
  private _gameEventsListener: OWGamesEvents;
  private _playersListElement: HTMLElement
  private _currentPlayer: {champion: string, skinId: number, summoner: string, team: 'Order' | 'Chaos'}
  private _clocks = {}

  private constructor() {
    super(kWindowNames.inGame);

    this._playersListElement = document.getElementById('players-list')
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public async run() {
    const gameClassId = await this.getCurrentGameClassId();

    const gameFeatures = kGamesFeatures.get(gameClassId);

    if (gameFeatures && gameFeatures.length) {
      this._gameEventsListener = new OWGamesEvents(
        {
          onInfoUpdates: this.onInfoUpdates.bind(this),
          onNewEvents: this.onNewEvents.bind(this)
        },
        gameFeatures
      );

      this._gameEventsListener.start();
    }
  }

  private onInfoUpdates(info) {
    if (info.game_info?.teams) {
      this._currentPlayer = JSON.parse(decodeURI(info.game_info?.teams))[0]
    }

    if (info.live_client_data.all_players) {
      const players = JSON.parse(info.live_client_data.all_players)

      for (const player of players) {
        if (player.team === this._currentPlayer.team.toUpperCase()) {
          continue
        }
        this._clocks[player.summonerName] = [0, 0]

        const championName = (player.championName.charAt(0).toUpperCase() + player.championName.slice(1).toLowerCase()).replace(new RegExp(/\W/, 'g'), '')
        const summonnerSpells = [player.summonerSpells.summonerSpellOne.rawDisplayName.split('_')[2], player.summonerSpells.summonerSpellTwo.rawDisplayName.split('_')[2]]

        const playerContainer = document.createElement('div')
        const avatarContainer = document.createElement('div')
        const summonerSpellContainer = document.createElement('div')
        const avatarImg = document.createElement('img')
        const summonerSpellContainers = [document.createElement('div'), document.createElement('div')]

        playerContainer.classList.add('player-container')
        playerContainer.id = player.summonerName.replace(new RegExp(/\W/, 'g'), '')
        avatarContainer.classList.add('avatar')
        summonerSpellContainer.setAttribute('class', 'summoner-spells')
        avatarImg.setAttribute('src', `https://ddragon.leagueoflegends.com/cdn/12.6.1/img/champion/${championName}.png`)

        for (const [index, summonerSpellContainer] of summonerSpellContainers.entries()) {
          summonerSpellContainer.setAttribute('class', 'summoner-spell-img')
          summonerSpellContainer.style.backgroundImage = `url("https://ddragon.leagueoflegends.com/cdn/12.6.1/img/spell/${summonnerSpells[index]}.png")`

          const clock = document.createElement('div')

          clock.id = `clock-${index}`

          summonerSpellContainer.append(clock)
        }

        for (const [index, c] of summonerSpellContainers.entries()) {
          c.addEventListener('click', () => {
            if (this._clocks[player.summonerName][index].intervalId !== undefined) {
              clearInterval(this._clocks[player.summonerName][index].intervalId)
            }

            const summonerCooldown = summonerSpellCooldown[summonnerSpells[index]]
           
            c.childNodes[0].textContent = summonerCooldown

            this._clocks[player.summonerName][index] = {summonerCooldown}

            c.childNodes[0].textContent = (this._clocks[player.summonerName][index].summonerCooldown--).toString()

            const intervalId = setInterval(() => {
              c.childNodes[0].textContent = (this._clocks[player.summonerName][index].summonerCooldown--).toString()

              if (this._clocks[player.summonerName][index].summonerCooldown < 0) {
                c.childNodes[0].textContent = undefined
                clearInterval(intervalId)
              }
            }, 1000)

            this._clocks[player.summonerName][index].intervalId = intervalId
          })
        }

        avatarContainer.append(avatarImg)
        summonerSpellContainer.append(...summonerSpellContainers)

        playerContainer.append(avatarContainer)
        playerContainer.append(summonerSpellContainer)

        this._playersListElement.append(playerContainer)
      }
    }
  }


  // Special events will be highlighted in the event log
  private onNewEvents(e) {}

  private async getCurrentGameClassId(): Promise<number | null> {
    const info = await OWGames.getRunningGameInfo();

    return (info && info.isRunning && info.classId) ? info.classId : null;
  }
}

InGame.instance().run();
