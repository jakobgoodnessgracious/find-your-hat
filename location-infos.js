
class LocationInfo {
    constructor({ LEFT = [], RIGHT = [], UP = [], DOWN = [] }) {
        this.LEFT = LEFT;
        this.RIGHT = RIGHT;
        this.UP = UP;
        this.DOWN = DOWN;
        this._bannedDirs = [];
    }

    hasBannedDir(direction) {
        return this._bannedDirs.includes(direction);
    }

    // only ever add one of a banned direction
    addOneBannedDir(direction) {
        if (!this.hasBannedDir(direction)) {
            this._bannedDirs.push(direction);
        }
    }

    updateLocationDirectionInfo({ LEFT = [], RIGHT = [], UP = [], DOWN = [] }) {
        this.LEFT = LEFT;
        this.RIGHT = RIGHT;
        this.UP = UP;
        this.DOWN = DOWN;
    }
}

class LocationInfos {
    constructor(locationInfos = {}) {
        this._locationInfos = locationInfos;
    }

    setLocationInfo([xLocation, yLocation], data) {
        const locationKey = xLocation + '-' + yLocation;
        if (!this._locationInfos[locationKey]) {
            this._locationInfos[locationKey] = new LocationInfo(data);
        } else {
            this._locationInfos[locationKey].updateLocationDirectionInfo(data);
        }
    }

    getLocationInfo(xLocation, yLocation) {
        return this._locationInfos[xLocation + '-' + yLocation];
    }
}

module.exports = LocationInfos;