export class GridCell {

    type = BuildingType.empty;

    str_speed = 0;
    str_numLanes = 0;
    str_bike = true;
    str_stairs = false;
    str_ramp = false;
    str_elevator = false;

    os_type = null;

    bld_numLevels = 1;
    bld_useGround = null;
    bld_useUpper = null;

    public static fillGridCellByFeature(gridCell, feature) {
        const featureProps = feature['properties'];
        for (let property of Object.keys(featureProps)) {
            if (property !== 'id') {
                if (property == 'height') {
                    if (featureProps['height']==0){
                        gridCell.bld_numLevels = 1;
                    } else {
                        gridCell.bld_numLevels = GridCell.bld_height_to_lvls(featureProps['height']);
                    }
                } else {
                    gridCell[property] = featureProps[property];
                }
            }
        }
    }

    static string_of_enum(enumn, value)
    {
        for (let k in enumn) {
            if (enumn[k] == value) {
                return k;
            }
        }
        return null;
    }

    static string_of_obj(objn, value)
    {
        let it = 0;
        for (let k in objn) {
            if(it == value) {
                return k
            }
            it+=1
        }
        return null;
    }

    static bld_lvl_to_height(levels) {
        return 4 + (levels - 1) * 3.0;
    }

    static bld_height_to_lvls(height) {
        return Math.floor((height - 4) / 3.0) + 1;
    }

    public static featureToTypemap(feature) {
        let typeDefinition = {}

        const properties = feature['properties'];
        switch (properties["type"]) {
            case BuildingType.building:
                typeDefinition["type"] = this.string_of_enum(BuildingType,properties["type"])
                typeDefinition["bld_numLevels"] = GridCell.bld_height_to_lvls(properties['height']);
                typeDefinition["bld_useGround"] = this.string_of_obj(BuildingUse, properties["bld_useGround"])
                typeDefinition["bld_useUpper"] = this.string_of_obj(BuildingUse, properties["bld_useUpper"])
                break;
            case BuildingType.open_space:
                typeDefinition["type"] = "open_space"
                typeDefinition["os_type"] = this.string_of_obj(OpenSpaceType, properties['os_type'])
                break;
            case BuildingType.street:
                typeDefinition["type"] = "street"
                typeDefinition["str_speed"] = properties["str_speed"]
                typeDefinition["str_numLanes"] = properties["str_numLanes"]
                typeDefinition["str_bike"] = properties["str_bike"]
                typeDefinition["str_stairs"] = properties["str_stairs"]
                typeDefinition["str_ramp"] = properties["str_ramp"]
                typeDefinition["str_elevator"] = properties["str_elevator"]
                break;
            default:
                typeDefinition["type"] = "empty"
        }
        return typeDefinition;
    }

    public static fillFeatureByGridCell(feature, gridCell: GridCell) {
        for (let gridCellKey of Object.keys(gridCell)) {
            if (gridCellKey === 'bld_numLevels') {
                feature.properties['height'] = GridCell.bld_lvl_to_height(gridCell[gridCellKey]);
            } else if (gridCellKey === 'type') {
                feature.properties[gridCellKey] = gridCell[gridCellKey];
                let color = '';
                if (gridCell[gridCellKey] === 0) {
                    // building
                    const specialUses = [3, 4, 5]; // types: educational, culture, grocery
                    if (gridCell.bld_useUpper == null ||
                        (specialUses.includes(gridCell.bld_useGround) && specialUses.includes(gridCell.bld_useUpper))) {
                        // single storey building or special use in ground floor
                        color = BuildingUse[Object.keys(BuildingUse)[gridCell.bld_useGround]];
                    } else {
                        color = BuildingUse[Object.keys(BuildingUse)[gridCell.bld_useUpper]];
                    }
                } else if (gridCell[gridCellKey] === 1) {
                    if (gridCell['str_numLanes'] === 0) {
                        // promenade
                        color = '#48A377';
                    } else {
                        // street
                        color = '#333333';
                    }
                    delete feature.properties["height"];
                } else if (gridCell[gridCellKey] === 2) {
                    // open space
                    color = OpenSpaceType[Object.keys(OpenSpaceType)[gridCell.os_type]];
                    delete feature.properties["height"];
                }   else {
                    // type == 3 -> empty
                    color = '#aaaaaa';
                    delete feature.properties["height"];
                }
                feature.properties['changedTypeColor'] = color;
            } else {
                feature.properties[gridCellKey] = gridCell[gridCellKey];
            }
        }
    }

    static int_of_enum(objn, value) {
        let it = 0;
        for (var k in objn) {
            if(k == value) {
                return it
            }
            it+=1
        }
        return null;
    }

    public static fillFeatureByCityIOType(feature, typeDict) {
        for (let gridCellKey of Object.keys(typeDict)) {
            if (gridCellKey === 'bld_numLevels') {
                feature.properties['height'] = GridCell.bld_lvl_to_height(typeDict[gridCellKey]);
            } else if (gridCellKey === 'type') {
                feature.properties[gridCellKey] = BuildingType[typeDict[gridCellKey]];
                if (typeDict[gridCellKey] == "empty"){
                    feature.properties['changedTypeColor'] = "#aaaaaa"
                } else if (typeDict[gridCellKey]=="street") {
                    feature.properties['changedTypeColor'] = "#333333"
                    if (typeDict["str_numLanes"] === 0) {
                        // promenade
                        feature.properties['changedTypeColor'] = "#48A377"
                    } else {
                        // street
                        feature.properties['changedTypeColor'] = "#333333"
                    }
                }
            } else if (gridCellKey === "bld_useUpper") {
                // upper storey colouring

                if (typeDict['bld_useGround'] == null) {
                    // error case
                    console.warn("no bld_useGround, this should not happen! in cell", feature["id"])
                    feature.properties['changedTypeColor'] = "#aaaaaa"
                    continue;
                }

                feature.properties['bld_useUpper'] = GridCell.int_of_enum(BuildingUse, typeDict[gridCellKey]);

                const specialUses = ['culture', 'educational', 'grocery'];
                if ((specialUses.includes(typeDict.bld_useGround) && !specialUses.includes(typeDict.bld_useUpper))
                    || typeDict[gridCellKey] === null) {
                    // special use present or is a 1-storey building -> use this colour instead
                    feature.properties['changedTypeColor'] = BuildingUse[typeDict['bld_useGround']];
                } else {
                    // normal behaviour
                    let color = BuildingUse[typeDict[gridCellKey]];
                    feature.properties['changedTypeColor'] = color;
                }
            } else if (gridCellKey === "bld_useGround") {
                // ground floor colouring

                if (typeDict[gridCellKey] != null) {
                    feature.properties['bld_useGround'] = GridCell.int_of_enum(BuildingUse, typeDict[gridCellKey]);
                } else {
                    console.warn("user should not be allowed to set bld_useGround to null! in cell", feature["id"])
                    feature.properties['changedTypeColor'] = "#aaaaaa"
                }
            } else if (gridCellKey === "os_type") {
                // open space
                feature.properties['os_type'] = GridCell.int_of_enum(OpenSpaceType, typeDict[gridCellKey])
                let color = OpenSpaceType[typeDict[gridCellKey]];
                feature.properties['changedTypeColor'] = color;
            } else {
                feature.properties[gridCellKey] = typeDict[gridCellKey];
            }
        }
    }
}

export enum BuildingType {
    building,
    street,
    open_space,
    empty,
}

enum BuildingUse {
    residential = "#FF6E40",
    commercial = "#FF5252",
    office = "#000000",
    educational = "#40C4FF",
    culture = "#7C4DFF",
    grocery = "#FF4081",
}

enum OpenSpaceType {
    green_space = "#69F0AE",
    promenade = "#AFF7D3",
    athletic_field = "#a5d6a7",
    playground = "#AFF7D3",
    daycare_playground = "#AFF7D3",
    schoolyard = "#AFF7D3",
    exhibition_space = "#A3A5FF",
    recycling_center = "#4D4D4D",
    water = "#9FE1FF"
}
