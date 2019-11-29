import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { interval, of, Observable } from "rxjs";
import * as rxjs from "rxjs/index";
import { catchError, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class CityIOService {
  baseUrl = "https://cityio.media.mit.edu/api/table/";
  updateUrl = "https://cityio.media.mit.edu/api/table/update/";
  tableName = "grasbrook_test";
  url = `${this.baseUrl}${this.tableName}`;

  table_data: any = {}; // can be accessed by other components, this will always be up to date
  update: Observable<number>;
  public mapPosition = new rxjs.BehaviorSubject({});

  pending_changes = {}
  public gridChangeListener = []
  lastHashes = {}

  constructor(private http: HttpClient) {
    this.updateData("header").subscribe()
    this.update = interval(10000);
    this.update.subscribe(() => {
      this.fetchCityIOdata().subscribe();
    });
  }

  /**
   * fetches cityio hashes and fetch data for changed fields
   * @param result - Observable<any> containing cityio table data
   */
  fetchCityIOdata(): Observable<any> {
    return this.http.get(this.url+"/meta/hashes").pipe(
      tap(data => {
        for(let key in data) {
          if(this.lastHashes[key] !== data[key]) {
            // data changed!
            this.updateData(key).subscribe() // get data for field that has changed
          }
        }
        this.lastHashes = data // update hashes
      }),
      catchError(this.handleError("getHashes"))
    );
  }

  /**
   * Get CityIO data once
   * @param field the endpoint to fetch data from (e.g. "grid")
   */
  updateData(field : string): Observable<any> {
    return this.http.get(this.url+"/"+field).pipe(
      tap(data => {
        this.table_data[field] = data;
        if (field === "grid") this.onGridChange()
      }),
      catchError(this.handleError("getData:"+field))
    );
  }

  onGridChange() {
    if(this.gridChangeListener.length == 0) return
    this.gridChangeListener[0]()
  }

  /**
   * POSTs all changed cells (pendung_changes) to cityIO.
   */
  pushAllChanges() {
    if(Object.keys(this.pending_changes).length == 0) return

    for(var key in this.pending_changes) {
      console.log(key, this.pending_changes[key])
      this.table_data["grid"][key] = this.pending_changes[key];
    }
    
    this.pushCityIOdata("grid", this.table_data["grid"]);
    this.pending_changes = {}
  }

  /**
   * POSTs data to cityIO. CAREFUL - this can overwrite with invalid data!
   * @param field the endpoint to post to. e.g. "grid" or "header"
   * @param data the actual data to put there
   */
  pushCityIOdata(field, data) {
    const postData = data
    const url = this.updateUrl + this.tableName + "/" + field
    console.log("pushing to ",url)
    this.http.post(url, postData).subscribe(
      (response) => console.log(response),
      (error) => console.log(error)
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      // Let the app keep running by returning:
      return of(result as T);
    };
  }
}