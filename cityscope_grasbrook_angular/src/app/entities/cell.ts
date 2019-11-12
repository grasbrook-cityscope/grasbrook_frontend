export class GridCell {

    type = BuildingType.building;

    str_speed = 50;
    str_numLanes = 0;
    str_bike = true;
    str_stairs = false;
    str_ramp = false;
    str_elevator = false;

    os_type = OpenSpaceType.green_space;

    bld_numLevels = 1;
    bld_useGround = BuildingUse.commercial;
    bld_useUpper = BuildingUse.residential;

    public static fillGridCellByFeature(gridCell, feature) {
        const properties = feature['properties'];
        for (let property of Object.keys(properties)) {
            if (property !== 'id') {
                if (property == 'height') {
                    gridCell.bld_numLevels = properties['height']
                } else {
                    gridCell[property] = properties[property];
                }
            }
        }
    }

    static string_of_enum(enumn, value)
    {
        for (var k in enumn)
            if (enumn[k] == value) 
                return k;
        return null;
    } 

    static string_of_obj(objn, value)
    {
        let it = 0
        for (var k in objn)
        {
            if(it == value) {
                return k
            }
            it+=1
        }
        return null;
    } 

    public static featureToTypemap(feature)
    {
        let typeDefinition = {}

        const properties = feature['properties'];
        typeDefinition["id"] = properties["id"]
        switch(properties["type"])
        {
            case BuildingType.building:
                typeDefinition["type"] = this.string_of_enum(BuildingType,properties["type"])
                typeDefinition["bld_numLevels"] = properties['height']
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
                return {}
        }
        return typeDefinition
        
        /*
        "base_height":0,
        "bld_numLevels":10,
        "bld_useGround":0,
        "bld_useUpper":0,
        "initial-color":"#A9A9A9",
        "os_type":"#69F0AE",
        "str_bike":true,
        "str_elevator":false,
        "str_numLanes":0,
        "str_ramp":false,
        "str_speed":50,
        "str_stairs":false,
        "type":0
        */
    }

    public static fillFeatureByGridCell(feature, gridCell: GridCell) {
        for (let key of Object.keys(gridCell)) {
            if (key === 'bld_numLevels') {
                feature.properties['height'] = gridCell[key];
            } else if (key === 'type') {
                feature.properties[key] = gridCell[key];
                let color = "";
                if (gridCell[key] === 0) {
                    color = BuildingUse[Object.keys(BuildingUse)[gridCell.bld_useUpper]];
                } else {
                    if (gridCell[key] === 1) {
                        color = '#333333';
                    } else if (gridCell[key] === 2) {
                        color = OpenSpaceType[Object.keys(OpenSpaceType)[gridCell.os_type]];
                    }
                    delete feature.properties["height"];
                }
                feature.properties['changedTypeColor'] = color;
            } else {
                feature.properties[key] = gridCell[key];
            }
        }
    }
}

enum BuildingType {
    building,
    street,
    open_space,
    empty,
}

enum BuildingUse {
    residential = "#FF6E40",
    commercial = "#FF5252",
    office = "#FF4081",
    educational = "#40C4FF",
    culture = "#7C4DFF",
}

enum OpenSpaceType {
    green_space = "#69F0AE",
    promenade = "#48A377",
    athletic_field = "#AFF7D3",
    playground = "#AFF7D3",
    daycare_playground = "#AFF7D3",
    schoolyard = "#AFF7D3",
    exhibition_space = "#A3A5FF",
    recycling_center = "#4D4D4D",
    water = "#9FE1FF"
}