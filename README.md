GoogleMapMultiWaypoints
=======================

A JavaScript library for creating routes with more than 8 waypoints. 

The problem is that Google Map API only allows a maximum of 8 waypoints (or 23 for Google Maps API for Work customers) for each route request. It is quite troublesome for individual developers to create routes with more than 8 waypoints. 

This JavaScript function splits the waypoints (including origin and destination) into multiple arrays of 10 locations (start, end and 8 waypoints). Then, it calls DirectionsService.route() multiple times. Routes are aggregated together and markers are manually displayed on the origin, the destination and each waypoints.  
