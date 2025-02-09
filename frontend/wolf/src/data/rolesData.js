export const rolesData = {
    "Voyante": {
        "camp": "Villageois",
        "description_courte": "Chaque nuit, tu peux espionner un joueur et découvrir son rôle.",
        "description_detaillee": "Tu es la Voyante ! Chaque nuit, tu as le pouvoir de voir le rôle exact d’un joueur. Utilise cette capacité pour aider les Villageois à identifier les Loups-Garous. Mais attention, si tu parles trop, tu risques d’être leur prochaine cible !",
        "caracteristiques": {
            "pouvoirs": "Tu regardes le rôle d'un joueur chaque nuit.",
            "actions_de_nuit": "Choisis un joueur et découvre son rôle.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Loup-Garou": {
        "camp": "Loups-Garous",
        "description_courte": "Chaque nuit, tu votes avec les autres Loups-Garous pour éliminer un joueur.",
        "description_detaillee": "Tu es un Loup-Garou ! Chaque nuit, toi et tes alliés choisissez une victime parmi les Villageois. Le jour, ton but est de rester discret et de semer la confusion pour éviter d’être démasqué. Sois malin et élimine-les un par un !",
        "caracteristiques": {
            "pouvoirs": "Tu participes au choix de la victime chaque nuit.",
            "actions_de_nuit": "Discute avec les autres Loups-Garous et désignez une cible.",
            "conditions_de_victoire": "Éliminez tous les Villageois."
        }
    },
    "Sorcière": {
        "camp": "Villageois",
        "description_courte": "Tu possèdes deux potions : une pour sauver, une pour tuer.",
        "description_detaillee": "Tu es la Sorcière ! Une fois par nuit, tu peux utiliser une de tes potions. L'une permet de sauver une victime des Loups-Garous, l’autre d’éliminer un joueur. Utilise-les au bon moment, car tu n’en as qu’une de chaque !",
        "caracteristiques": {
            "pouvoirs": "Tu peux sauver une victime ou éliminer un joueur une fois par partie.",
            "actions_de_nuit": "Reçois le nom de la victime des Loups-Garous et choisis d’utiliser ou non tes potions.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Cupidon": {
        "camp": "Villageois",
        "description_courte": "Au début du jeu, tu désignes deux joueurs qui tomberont amoureux.",
        "description_detaillee": "Tu es Cupidon ! Dès le début de la partie, tu choisis deux joueurs qui seront liés par l’amour. S’ils sont dans des camps opposés, ils doivent trahir les leurs pour survivre ensemble. Ton choix peut changer toute la partie !",
        "caracteristiques": {
            "pouvoirs": "Lie deux joueurs par l’amour au début du jeu.",
            "actions_de_nuit": "Choisis deux joueurs. S'ils sont en couple, ils ne peuvent plus survivre l’un sans l’autre.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous, sauf si un Amoureux survit."
        }
    },
    "Chasseur": {
        "camp": "Villageois",
        "description_courte": "Si tu meurs, tu peux immédiatement éliminer un joueur de ton choix.",
        "description_detaillee": "Tu es le Chasseur ! Si on t’élimine, tu ne partiras pas seul. Avant de mourir, tu peux choisir un joueur et l’entraîner avec toi dans la tombe. Utilise bien cette capacité pour venger ton camp !",
        "caracteristiques": {
            "pouvoirs": "Si tu meurs, tu élimines un joueur immédiatement.",
            "actions_de_nuit": "Aucune action sauf si tu es tué.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Petite Fille": {
        "camp": "Villageois",
        "description_courte": "Chaque nuit, tu peux espionner discrètement les Loups-Garous.",
        "description_detaillee": "Tu es la Petite Fille ! Tu peux observer les Loups-Garous pendant la nuit, mais attention : si tu te fais repérer, tu risques d’être leur prochaine cible !",
        "caracteristiques": {
            "pouvoirs": "Peut observer les Loups-Garous en pleine nuit.",
            "actions_de_nuit": "Regarde discrètement les Loups-Garous, mais sans se faire repérer.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Salvateur": {
        "camp": "Villageois",
        "description_courte": "Chaque nuit, tu protèges un joueur contre l’attaque des Loups-Garous.",
        "description_detaillee": "Tu es le Salvateur ! Chaque nuit, tu peux choisir un joueur à protéger contre les attaques des Loups-Garous. Tu peux même te protéger toi-même, mais pas deux nuits de suite !",
        "caracteristiques": {
            "pouvoirs": "Protège un joueur chaque nuit.",
            "actions_de_nuit": "Choisis un joueur (ou toi-même) à protéger.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Joueur de Flûte": {
        "camp": "Neutre",
        "description_courte": "Chaque nuit, tu charmes des joueurs. Si tu les charmes tous, tu gagnes seul.",
        "description_detaillee": "Tu es le Joueur de Flûte ! Chaque nuit, tu peux ensorceler des joueurs. Si à un moment donné tous les joueurs restants sont charmés, tu gagnes immédiatement la partie ! Mais attention, si tu te fais repérer, ils ne te laisseront pas faire...",
        "caracteristiques": {
            "pouvoirs": "Charme un ou plusieurs joueurs chaque nuit.",
            "actions_de_nuit": "Choisis des joueurs à charmer.",
            "conditions_de_victoire": "Si tous les joueurs restants sont charmés, tu gagnes seul."
        }
    },
    "Renard": {
        "camp": "Villageois",
        "description_courte": "Tu peux flairer un groupe de 3 joueurs pour savoir si un Loup-Garou est présent.",
        "description_detaillee": "Tu es le Renard ! Chaque nuit, tu peux sentir si un Loup-Garou est caché parmi trois joueurs de ton choix. Si aucun Loup n’est détecté, tu perds ton pouvoir !",
        "caracteristiques": {
            "pouvoirs": "Détecte la présence d’un Loup-Garou dans un groupe de 3 joueurs.",
            "actions_de_nuit": "Désigne 3 joueurs et découvre si un Loup-Garou s’y cache.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Infect Père des Loups": {
        "camp": "Loups-Garous",
        "description_courte": "Une fois dans la partie, tu peux transformer une victime en Loup-Garou.",
        "description_detaillee": "Tu es l'Infect Père des Loups ! Une seule fois dans la partie, après une attaque nocturne réussie des Loups-Garous, tu peux décider d'infecter la victime et la faire rejoindre votre camp. Choisis bien ton moment, car c'est ton seul pouvoir !",
        "caracteristiques": {
            "pouvoirs": "Peut transformer une victime en Loup-Garou une seule fois.",
            "actions_de_nuit": "Choisis si tu veux infecter la victime après une attaque réussie.",
            "conditions_de_victoire": "Les Loups-Garous doivent éliminer tous les Villageois."
        }
    },
    "Ancien": {
        "camp": "Villageois",
        "description_courte": "Tu résistes à la première attaque des Loups-Garous, mais ta mort affaiblit les Villageois.",
        "description_detaillee": "Tu es l'Ancien ! Si les Loups-Garous t'attaquent, tu résistes et restes en vie. Mais attention : si tu es éliminé par le village ou par la Sorcière, tous les rôles spéciaux des Villageois disparaissent !",
        "caracteristiques": {
            "pouvoirs": "Résiste à la première attaque des Loups-Garous.",
            "actions_de_nuit": "Aucune action spécifique.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Bouc Émissaire": {
        "camp": "Villageois",
        "description_courte": "Si le vote du village est une égalité, c'est toi qui meurs à leur place.",
        "description_detaillee": "Tu es le Bouc Émissaire ! Si le village ne parvient pas à départager un vote et que c'est une égalité, c'est toi qui sera automatiquement éliminé. Et pire encore, au tour suivant, tu choisis qui ne pourra pas voter !",
        "caracteristiques": {
            "pouvoirs": "Meurt en cas d'égalité lors du vote du village.",
            "actions_de_nuit": "Aucune action spécifique.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Villageois": {
        "camp": "Villageois",
        "description_courte": "Tu n’as aucun pouvoir spécial, mais ton vote est crucial.",
        "description_detaillee": "Tu es un simple Villageois. Ton rôle est d'observer, de débattre et de voter intelligemment pour éliminer les Loups-Garous. Attention aux manipulations, ton instinct est ta meilleure arme !",
        "caracteristiques": {
            "pouvoirs": "Aucun pouvoir spécial.",
            "actions_de_nuit": "Aucune action spécifique.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    },
    "Corbeau": {
        "camp": "Villageois",
        "description_courte": "Chaque nuit, tu accuses un joueur qui recevra 2 votes contre lui au prochain conseil.",
        "description_detaillee": "Tu es le Corbeau ! Chaque nuit, tu peux désigner un joueur qui recevra automatiquement 2 votes supplémentaires au prochain vote du village. Utilise ce pouvoir pour orienter les débats… ou semer la discorde !",
        "caracteristiques": {
            "pouvoirs": "Désigne un joueur qui recevra 2 votes supplémentaires au vote du village.",
            "actions_de_nuit": "Choisis un joueur à accuser.",
            "conditions_de_victoire": "Les Villageois doivent éliminer tous les Loups-Garous."
        }
    }
};