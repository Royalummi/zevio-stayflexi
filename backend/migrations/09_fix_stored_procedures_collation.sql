-- ============================================================================
-- FIX STORED PROCEDURES - COLLATION ISSUE
-- ============================================================================

USE zevio;

-- Drop existing procedures
DROP PROCEDURE IF EXISTS populate_apartment_calendar;
DROP PROCEDURE IF EXISTS auto_populate_service_apartment_calendar;

-- Recreate with collation fix
DELIMITER //

CREATE PROCEDURE populate_apartment_calendar(
  IN p_property_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  IN p_base_price DECIMAL(12,2),
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  DECLARE v_current_date DATE;
  
  SET v_current_date = p_start_date;
  
  WHILE v_current_date <= p_end_date DO
    INSERT INTO booking_calendar (
      id, property_id, date, status, price
    ) VALUES (
      UUID(), p_property_id, v_current_date, 'available', p_base_price
    )
    ON DUPLICATE KEY UPDATE
      price = p_base_price,
      status = 'available';
    
    SET v_current_date = DATE_ADD(v_current_date, INTERVAL 1 DAY);
  END WHILE;
  
  SELECT CONCAT('Calendar populated from ', p_start_date, ' to ', p_end_date) as result;
END //

CREATE PROCEDURE auto_populate_service_apartment_calendar(
  IN p_property_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  DECLARE property_price DECIMAL(12,2);
  DECLARE property_type_name VARCHAR(100);
  DECLARE v_start_date DATE;
  DECLARE v_end_date DATE;
  
  SELECT 
    p.price_per_night,
    pt.name
  INTO 
    property_price,
    property_type_name
  FROM properties p
  LEFT JOIN property_types pt ON p.property_type_id = pt.id
  WHERE p.id = p_property_id COLLATE utf8mb4_unicode_ci;
  
  IF property_type_name = 'Service Apartment' THEN
    SET v_start_date = CURDATE();
    SET v_end_date = DATE_ADD(CURDATE(), INTERVAL 2 YEAR);
    
    CALL populate_apartment_calendar(p_property_id, property_price, v_start_date, v_end_date);
    
    SELECT CONCAT('Auto-populated 2-year calendar for Service Apartment: ', p_property_id) as result;
  ELSE
    SELECT 'Not a Service Apartment - calendar not populated' as result;
  END IF;
END //

DELIMITER ;
