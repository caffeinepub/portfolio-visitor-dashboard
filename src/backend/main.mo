import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Array "mo:core/Array";

actor {
  type Visit = {
    timestamp : Time.Time;
    userAgent : Text;
    referrer : Text;
  };

  module Visit {
    public func compare(visit1 : Visit, visit2 : Visit) : Order.Order {
      Int.compare(visit2.timestamp, visit1.timestamp); // Descending order
    };
  };

  let visits = Map.empty<Time.Time, Visit>();

  func getVisitInternal(timestamp : Time.Time) : Visit {
    switch (visits.get(timestamp)) {
      case (null) { Runtime.trap("No visit stored with this timestamp.") };
      case (?visit) { visit };
    };
  };

  public type SummaryStats = {
    totalVisits : Nat;
    visitsToday : Nat;
    visitsPerDay : [(Text, Nat)];
  };

  public shared ({ caller }) func logVisit(userAgent : Text, referrer : Text) : async () {
    let timestamp = Time.now();
    let visit : Visit = {
      timestamp;
      userAgent;
      referrer;
    };
    visits.add(timestamp, visit);
  };

  public query ({ caller }) func getTotalVisitCount() : async Nat {
    visits.size();
  };

  public query ({ caller }) func getAllVisits() : async [Visit] {
    visits.values().toArray().sort();
  };
};
