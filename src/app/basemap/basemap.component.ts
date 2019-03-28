import { Component, OnInit } from "@angular/core";
import { environment } from "../../environments/environment";
import * as mapboxgl from "mapbox-gl";
import { CityioService } from "../cityio/cityio.service";

@Component({
  selector: "basemap",
  templateUrl: "./basemap.component.html",
  styleUrls: ["./basemap.component.css"]
})
export class BasemapComponent implements OnInit {
  map: mapboxgl.Map;
  style = "mapbox://styles/relnox/cjs9rb33k2pix1fo833uweyjd";

  center: number[];
  constructor(private cityioService: CityioService) {
    // get the acess token
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  ngOnInit() {
    this.cityioService.getCityIOdata().subscribe(cityIOdata => {
      this.initializeMap(cityIOdata);
    });
  }

  private initializeMap(cityIOdata) {
    this.center = [
      cityIOdata.header.spatial.latitude,
      cityIOdata.header.spatial.longitude
    ];
    // add the base map and config
    this.map = new mapboxgl.Map({
      container: "basemap",
      style: this.style,
      zoom: 15,
      bearing: 0,
      rotation: cityIOdata.header.spatial.rotation,
      pitch: 60,
      center: this.center
    });
  }
}
