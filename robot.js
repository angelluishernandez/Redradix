"use strict";

async function main(tank) {
	// variables
	let isNearEdge = false;
	let enemyFound = false;
	let scanOrientation = (await tank.getX()) > 650 ? 180 - 20 : -20;

	let scan = 0;
	let shotCorrection = 0;

	///////////// To handle movement
	let myLastTankPosition = [];

	let lastEnemyPositions = [];

	// random direction to start the engine

	let randomDirection = Math.floor(Math.random() * (359 - 1 + 1)) + 1;

	// auxiliary functions

	/// Store my tank info
	async function pushPosition(direction) {
		myLastTankPosition.push(direction);
	}

	/// Store enemy tank info

	async function pushEnemyPosition(position, angle) {
		lastEnemyPositions.push({ position, angle });
		if (lastEnemyPositions.length > 2) {
			lastEnemyPositions.splice(0, lastEnemyPositions.length - 2);
		}
	}

	// Check if tank is near the border

	async function isTankNearEdge(tank, posX, posY) {
		if (posX > 1100 || posX < 150 || posY > 800 || posY < 150) {
			isNearEdge = true;
			await tank.drive(0, 0);
		} else {
			isNearEdge = false;
		}
	}

	// Scan functions

	async function scanForEnemies(tank) {
		enemyFound ? (scanOrientation -= 10) : (scanOrientation += 15);

		scan = await tank.scan(
			!enemyFound
				? scanOrientation
				: lastEnemyPositions[lastEnemyPositions.length - 1].angle,
			10
		);
		if (scan !== 0) {
			enemyFound = true;
			await pushEnemyPosition(scan, scanOrientation);

			lastEnemyPositions.splice(0, lastEnemyPositions.length - 2);
		} else {
			enemyFound = false;
		}
	}

	async function shootTheEnemy(tank) {
		// store data from the last position in the array to use it more easily

		let arrLastItemPosition =
			lastEnemyPositions[lastEnemyPositions.length - 1].position;
		let arrLastItemAngle =
			lastEnemyPositions[lastEnemyPositions.length - 1].angle;

		if (arrLastItemPosition > 300) {
			shotCorrection = -10;
		} else {
			shotCorrection = 0;
		}

		// drive towards the enemy

		await tank.drive(arrLastItemAngle, 50);

		// scan a previous position

		await tank.scan(arrLastItemAngle - 10, 10);
		// shot at the last registered position with a bit of correction

		await tank.shoot(
			arrLastItemAngle - shotCorrection,
			arrLastItemPosition + 100
		);
		// if no enemy is found return to the main scan function

		if ((await tank.scan(arrLastItemAngle, 10)) === 0) {
			enemyFound = false;
		}
	}

	async function driveOffTheEdge(posX, posY) {
		// if is in the left
		if (posX < 150) {
			if (myLastTankPosition.length < 1) {
				await pushPosition(Math.floor(Math.random() * (335 - 295 + 1)) + 295);
			}
			await tank.drive(myLastTankPosition[0], 50);
		}

		// if is in the top

		if (posY > 800) {
			if (myLastTankPosition.length < 1) {
				await pushPosition(Math.floor(Math.random() * (290 - 250 + 1)) + 250);
			}
			await tank.drive(myLastTankPosition[0], 50);
		}

		// if is in the right

		if (posX > 1100) {
			if (myLastTankPosition.length < 1) {
				await pushPosition(Math.floor(Math.random() * (200 - 160 + 1)) + 160);
			}
			await tank.drive(myLastTankPosition[0], 50);
		}

		// if is in bottom
		if (posY < 150) {
			if (myLastTankPosition.length < 1) {
				await pushPosition(Math.floor(Math.random() * (110 - 70 + 1)) + 70);
			}
			await tank.drive(myLastTankPosition[0], 50);
		}
	}

	//////////////////////////////////////////////////////

	// main loop

	while (true) {
		let posX = await tank.getX();
		let posY = await tank.getY();

		await isTankNearEdge(tank, posX, posY);

		// Start the tank

		if (!isNearEdge && (await tank.getSpeed()) === 0) {
			await tank.drive(randomDirection, 100);
			myLastTankPosition = [];
		}

		// If not enemy found keep looking for it

		if (!enemyFound) {
			await scanForEnemies(tank);
		}

		// if enemy found keep driving, scanning and shooting
		if (enemyFound) {
			await shootTheEnemy(tank);
		}

		// if is near an edge find another direction

		if (isNearEdge && !enemyFound) {
			await driveOffTheEdge(posX, posY);
		}

		// Once is not on the edge clear direction array so another direction can be pushed in the future

		if (!isNearEdge) {
			myLastTankPosition = [];
		}
	}
}
