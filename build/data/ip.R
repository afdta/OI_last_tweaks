library(tidyverse)
library(jsonlite)
library(readxl)

#From Chad:
#All the data will be uploaded here: 
dir_data <- "https://app.box.com/v/BMPPOpptyInd-Interactive"

#downloadable data for each metro area here: 
dir_download <- "https://app.box.com/v/BMPPOI-MetroJobShares"

#vars in flow data
#occ_a - SOC of starting occ
#titlea - Title of starting occ
#occ_b - SOC of ending occ
#titleb - Title of ending occ

#p_h_wage - Hourly wage in starting occ
#p_a_wage - Annual wage in starting occ
#f_h_wage – Hourly wage in ending occ
#f_a_wage – Annual wage in ending occ

#probs - Share of employed in starting occ that end up in ending occ
#opportunity - Share of employed in starting occ that will hold a good job when they reach the ending occ
#other – Share of employed in starting occ that do not have and will not have a good job at start or end of pathway
#weight – Raw person weight (number of employed in that starting occ meeting personal descriptors as implied by ACS data) – ignore this

###OPPORTUNITY INDUSTRY PANEL (AND METRO SHARES PANEL)

ind0 <- read_csv("/home/alec/Projects/Brookings/opportunity-industries/build/data/met_opptyind2017s.csv") 

ind <- ind0 %>% mutate(hi=hi_good_share + hi_promising_share) %>% filter(is.na(metdiv_code)) %>%
                select(cbsa=cbsa_code, naics, ind=industry, g=good_share, p=promising_share, hi, o=other_share, u=undefined, l=level)

#indtu <- ind %>% mutate(un=1-(g+p+hi+o)) %>% mutate(diff = u - un)

ind2 <- ind %>% filter(l==2 | l==1)

#duplicates, max val?
counts <- ind2 %>% group_by(cbsa) %>% summarise(n=n())
ind2 %>% filter(is.na(naics)) %>% summarise(max=max(g, p, hi, o, u))
ind2_codes <- unique(ind2[c("naics", "ind")]) %>% mutate(naics=as.character(naics))

indkeys0 <- read_xlsx("/home/alec/Projects/Brookings/opportunity-industries/build/data/Shortened titles.xlsx", sheet="Industries") %>%
            mutate(naics_ = sub("-.*$", "", Code)) %>% mutate(naics=ifelse(naics_=="92", "90", naics_)) %>% mutate(nchar = nchar(naics)) 

ind2_codes2 <- inner_join(ind2_codes, indkeys0, by="naics")

indkeys <- indkeys0 %>% select(naics, ind=`Short title`) %>% 
            spread(naics, ind) %>% unbox()

metros <- ind0 %>% select(code=cbsa_code, name=CBSA_Title) %>% unique()

indjson <- toJSON(ind2 %>% select(-ind, -l) %>% as.data.frame() %>% split(.$cbsa) %>% lapply(function(d){return(d %>% select(-cbsa))}), na="null", digits=5, pretty=TRUE)

#check of logic
alt <- list()
alt$one <- as.data.frame(ind2 %>% select(-ind, -l))
alt$two <- split(alt$one, alt$one$cbsa)
alt$three <- lapply(alt$two, function(d){
  return(select(d, -cbsa))
})
alt$json <- toJSON(alt$three, na="null", digits=5, pretty=TRUE)


writeLines(c("var industry_data = ", indjson, ";", 
             "var industry_names = ", toJSON(indkeys), ";",
             "var cbsas = ", toJSON(metros), ";",
             "export {industry_data, industry_names, cbsas};"), con = "/home/alec/Projects/Brookings/opportunity-industries/build/js/industry-data.js")


### OCCUPATION FLOWS

educ_short <- tibble(educ_long=c("All sub-baccalaureate levels", "Baccalaureate degree or higher", "Total"), educ=c("Sub", "BA", "Tot"))

flows_in <- read_csv("/home/alec/Projects/Brookings/opportunity-industries/build/data/flowsedu_2d.csv") %>% 
            rename(educ_long=educ) %>% 
            full_join(educ_short, ., by="educ_long") 

flows0 <- flows_in %>% filter(educ != "Tot", is.na(metdiv_code))

#4 metros have fewer obs than the others -- BA, 3 metros are missing starting occ 45 
#17820 CO Springs,  #19660 Deltona, and #46140 Tulsa
#occ 45 == Agriculture -- these missings are handled in code

counts <- flows0 %>% group_by(cbsa) %>% summarise(n=n())
counts <- flows0 %>% group_by(educ, occ2_a) %>% summarise(n=n())

#occupational shares of total
shares_ <- flows0 %>% group_by(cbsa, educ, occ2_a) %>% summarise(opp_pop=sum(opportunity_pop), oth_pop=sum(other_pop), tot_pop=sum(probs_pop)) %>%
                     mutate(tot_tot = opp_pop + oth_pop) %>%
                     mutate(opp=round(opp_pop/sum(tot_tot), digits=3), oth= round(oth_pop/sum(tot_tot), digits=3), sh=tot_pop/sum(tot_pop))

unique(flows_in[c("educ","educ_long")])
unique(shares_[c("educ")])

#why 120 metros? why some missing educ levels                     
shares <- shares_ %>% split(.$cbsa) %>% 
                      lapply(function(d){
                       r <- d %>% ungroup() %>% split(.$educ) %>% lapply(function(dd){
                         return(dd %>% select(occ=occ2_a, opp, oth))
                       })
                       return(r)
                     })
  


#flows data structure
flows <- flows0 %>% split(.$cbsa) %>% lapply(function(d){
  r <- d %>% ungroup() %>% split(.$educ) %>% lapply(function(dd){
    rr <- dd %>% split(.$occ2_a) %>% lapply(function(ddd){
      return(ddd %>% mutate(opp=round(opportunity, digits=3), oth=round(other, digits=3)) %>% select(occ=occ2_b, opp, oth))
    }) 
    return(rr)
  }) 
  return(r)
}) 

json_flows <- toJSON(flows, na="null", digits=3)
json_shares <- toJSON(shares, na="null", digits=3)

occ_names <- read_xlsx("/home/alec/Projects/Brookings/opportunity-industries/build/data/Shortened titles.xlsx", sheet="Occupations") %>%
  mutate(occ_code = sub("-.*$", "", Code)) %>% mutate(nchar = nchar(occ_code)) %>% select(occ_code, Title=`Short title`) %>% 
  spread(occ_code, Title) %>% unbox()

writeLines(c("var occ_flows = ", json_flows, ";", 
             "var occ_shares = ", json_shares, ";",
             "var occ_names = ", toJSON(occ_names), ";",
             "export {occ_flows, occ_shares, occ_names};"), con = "/home/alec/Projects/Brookings/opportunity-industries/build/js/occupation-data.js")


#UNUSED
occs <- read_csv("/home/alec/Projects/Brookings/opportunity-industries/build/data/met_opptyocc2017j.csv") %>% 
  filter(level==2) %>% mutate(occ=substr(sub("-","",soc_code), 1, 2))

occs2 <- occs %>% group_by(cbsa_code, CBSA_Title, metdiv_title) %>% mutate(shtot=total/sum(total))

occs2 %>% summarise(shtotal = sum(shtot))
