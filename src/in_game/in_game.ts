import {
  OWGames,
  OWGamesEvents,
} from "@overwolf/overwolf-api-ts";


import { AppWindow } from "../AppWindow";
import { kWindowNames, kGamesFeatures } from "../consts";

class InGame extends AppWindow {
  private static _instance: InGame;
  private _gameEventsListener: OWGamesEvents;
  private _playersListElement: HTMLElement
  private _currentPlayer: {champion: string, skinId: number, summoner: string, team: 'Order' | 'Chaos'}

  private constructor() {
    super(kWindowNames.inGame);

    this._playersListElement = document.getElementById('players-list')

    //this._infoLog = document.getElementById('infoLog');
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
    console.log('info =', info)
    if (info.game_info?.teams) {
      this._currentPlayer = JSON.parse(decodeURI(info.game_info?.teams))[0]

      console.log('currentPlayerInfo =', this._currentPlayer)
    }

    if (info.live_client_data.all_players) {
      const players = JSON.parse(info.live_client_data.all_players)

      console.log('allPlayers =', players)

      for (const player of players) {
        if (player.team === this._currentPlayer.team.toUpperCase()) {
          continue
        }

        const playerContainer = document.createElement('div');
        const avatarContainer = document.createElement('div')
        const summonerSpellContainer = document.createElement('div')
        const avatarImg = document.createElement('img')
        const summonerSpellImgs = [document.createElement('img'), document.createElement('img')]

        playerContainer.setAttribute('class', 'player-container')
        avatarContainer.setAttribute('class', 'avatar')
        summonerSpellContainer.setAttribute('class', 'summoner-spell')
        avatarImg.setAttribute('src', `https://ddragon.leagueoflegends.com/cdn/12.6.1/img/champion/${player.championName.replace(/\W/, '')}.png`)
        summonerSpellImgs[0].setAttribute('src', `https://ddragon.leagueoflegends.com/cdn/12.6.1/img/spell/${player.summonerSpells.summonerSpellOne.rawDisplayName.split('_')[2]}.png`)
        summonerSpellImgs[1].setAttribute('src', `https://ddragon.leagueoflegends.com/cdn/12.6.1/img/spell/${player.summonerSpells.summonerSpellTwo.rawDisplayName.split('_')[2]}.png`)

        console.log('summonerSpellImgs =', summonerSpellImgs.map(e => e.getAttribute('src')))

        avatarContainer.append(avatarImg)
        summonerSpellContainer.append(...summonerSpellImgs)

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
